const accessTokens = require('../db/accessTokens');
const refreshTokens = require('../db/refreshTokens');
const utils = require('../utils');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const users = require('../db/users');
const moment = require('moment');

// generate token
module.exports.generate = function(grant_id, client_id, user_id, scope, done) {

    // TODO: validate input
    
    accessTokens.create(grant_id, client_id, user_id, scope, function (err, accessToken) {
        // TODO Which error?
        if (err) return done(err);
        
        let extra = {};
        extra.scope = scope;
        
        // TODO: make the expiration configurable. For now, 1 hour
        extra.expires_in = 3600;
        
        // TODO: messy
        
        if (utils.offlineAccessScope(scope)) {
            refreshTokens.create(grant_id, function(err, refreshToken) {
                // TODO: Error handling
                console.log('generated refresh token: ' + refreshToken);
                if (!utils.openIdScope(scope)) {
                    // no id token is needed, so return
                    return done(null, accessToken, refreshToken, extra);
                }
                
                generateIdToken({
                    user: {
                        user_id: user_id
                    },
                    client: {
                        client_id: client_id
                    },
                    scope: scope
                }, function(err, idToken) {
                    console.log('--- generated ID Token');
                    console.log(idToken);
                    console.log('Refresh token: ')
                    console.log(refreshToken);
                    extra.id_token = idToken;
                    return done(null, accessToken, refreshToken, extra);
                });
            });
        } else {
        
            if (!utils.openIdScope(scope)) {
                // no id token is needed, so return
                return done(null, accessToken, null, extra);
            }
            
            generateIdToken({
                user: {
                    user_id: user_id
                },
                client: {
                    client_id: client_id
                },
                scope: scope
            }, function(err, idToken) {
                extra.id_token = idToken;
                return done(null, accessToken, null, extra);
            });
        }
    });
};

function generateIdToken(context, callback) {
    console.log('generating ID token');
    /*
    context = {
        user: {
            user_id...
        }, 
        client: {
            client_id, 
        },
        scope: ['openid', 'profile'],
        nonce: '1234123ssdf'
    }
    */
    
    // load the user record so we get all available claims
    users.findById(context.user.user_id, function(err, user) {
        if (err) return callback(err);
        
        if (!user) return callback(new Error('User not found while generating jwt'));
        
        //TODO: make the expiration configurable. for now, 1 hour
        let exp = moment().add(1, 'h').unix();
        
        // get the normalized and scoped user profile (i.e. is limited by the openid scopes)
        let scopedProfile = utils.scopedProfile(user, context.scope);
        
        let jwtPayload = scopedProfile;
        _.assign(jwtPayload, {
            iss: process.env.BASE_URL,
            aud: context.client.client_id,
            exp: exp,
            azp: context.client.client_id
        });
        
        let jwtHeader = {
            algorithm: 'RS256',
            keyid: process.env.PUBLIC_KEY_ID
        };
        
        let signingKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
        
        jwt.sign(jwtPayload, signingKey, jwtHeader, function(err, jwt) {
            // TODO error logging
            if (err) return done(err);
            return callback(null, jwt);
        });
    });
}
