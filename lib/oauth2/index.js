const oauth2orize = require('oauth2orize');
const oauth2orize_openid = require('oauth2orize-openid');
const server = oauth2orize.createServer();
const express = require('express');
const router = express.Router();
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const passport = require('passport');
const ClientPasswordStrategy = require('passport-oauth2-client-password');
const BearerStrategy = require('passport-http-bearer');
const clients = require('../db/clients');
const accessTokens = require('../db/accessTokens');
const users = require('../db/users');
const utils = require('../utils');
const x509 = require('x509');
const _ = require('lodash');
const consent = require('./internals/consent');
const AuthorizationError = require('oauth2orize').AuthorizationError;

/*
    setup the various passport strategies
*/
passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
        clients.findById(clientId, function(err, client) {
            if (err) return done(err);
            if (!client) return done(null, false);
            // TODO: Should return invalid_client error
            if (client.client_secret !== clientSecret) return done(null, false);
            return done(null, client);
        });
    }
));

passport.use(new BearerStrategy(
    function(token, done) {
        accessTokens.findByToken(token, function(err, tokenRecord) {
            if (err) return done(err);
            if (!tokenRecord) return done(err, false);

            // find user associated with this token
            users.findById(tokenRecord.user_id, function(err, user) {
                if (err) return done(err);
                return done(null, user, {
                    scope: tokenRecord.scope
                });
            });
        });
    }
));

/*
    setup the various oauth2orize grants, exchanges, etc.
*/
server.serializeClient(function(client, done) {
    return done(null, client.client_id);
});

server.deserializeClient(function(id, done) {
    clients.findById(id, function(err, client) {
        return done(null, client);
    });
});

server.grant(oauth2orize_openid.extensions());
server.grant(oauth2orize.grant.code(require('./grant/code')));
server.exchange(oauth2orize.exchange.code(require('./exchange/code')));
server.exchange(oauth2orize.exchange.refreshToken(require('./exchange/refreshToken')));


/*
    oauth2 endpoints
*/
module.exports.authorize = [
    ensureLoggedIn(),
    require('./internals/accountLinking'),
    server.authorization(require('./internals/validate'), require('./internals/immediate'), require('./internals/complete')),
    consent.showConsent,
    server.errorHandler({ mode: 'indirect' })
];

module.exports.decision = [
    ensureLoggedIn(),
    server.decision(consent.decisionFunction),
    server.errorHandler({ mode: 'indirect' })
];

module.exports.token = [
    passport.authenticate(['oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
];

module.exports.userinfo = [
    // http://openid.net/specs/openid-connect-core-1_0.html#UserInfo
    passport.authenticate('bearer', { session: false }),
    function(req, res) {
        let scopedUser = utils.scopedProfile(req.user, req.authInfo.scope);
        res.json(scopedUser);
    }
];

module.exports.config = [
    function (req, res) {
        // https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
        let base_url = process.env.BASE_URL;
        return res.json({
            issuer: base_url,
            authorization_endpoint: base_url + '/authorize',
            token_endpoint: base_url + '/token',
            userinfo_endpoint: base_url + '/userinfo',
            jwks_uri: base_url + '/.well-known/jwks',
            response_types_supported: ['code'],
            id_token_signing_alg_values_supported: ['RS256'],
            claims_supported: ["sub", "iss", "auth_time", "acr", "name", "given_name", "family_name", "nickname", "profile", "picture", "email", "email_verified", "locale"],
            ui_locales_supported: ['en-US'],
            end_session_endpoint: base_url + '/oidc/logout'
        });
    }
];

module.exports.jwks = [
    function(req, res) {
        let publicKeyCert = process.env.PUBLIC_KEY_CERT.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

        let cert = x509.parseCert(publicKeyCert);
        
        let jwk = {
            alg: 'RS256',
            kty: 'RSA',
            use: 'sig',
            n: cert.publicKey.n,
            kid: process.env.PUBLIC_KEY_ID
        }

        let response = {
            "keys": [].concat(jwk)
        }
        return res.json(response);
    }
];

/*
    OIDC session management spec - RP initiated logout
    e.g. http://localhost:4000/oidc/logout
    http://openid.net/specs/openid-connect-session-1_0.html#RPLogout
*/
module.exports.oidcLogout = [
    function verify(req, res, next) {
        if (!req.isAuthenticated) return next();
        // TODO verify the payload
        // query params : 
        // id_token_hint RECOMMENDED
        // post_logout_redirect_uri OPTIONAL
        // state OPTIONAL
        // TODO Verify the post_logout_uri with the client registration
        return next();
    },
    function logout(req, res, next) {
        let qs = '';
        if (req.params.state) {
            qs = '?state=' + req.params.state;
        }

        req.session.destroy(function(err) {
            return res.redirect(req.query.post_logout_redirect_uri + qs);
        });        
    }
];