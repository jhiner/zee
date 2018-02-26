const authzCodes = require('../../db/authorizationCodes');
const AuthorizationError = require('oauth2orize').AuthorizationError;
const tokens = require('../tokens');

module.exports = function(client, code, redirectUri, body, authInfo, done) {
    console.log('code exchange');

    authzCodes.findAndDeleteByCode(code, function(err, authzCode) {
        if (err) return done(err);
        if (!authzCode) return done(new AuthorizationError('Grant not found','invalid_grant'));

        // compare the redirect uri, client, etc, to authz code authzCode record
        if (authzCode.client_id !== client.client_id) return done(new AuthorizationError('Client mismatch','invalid_grant'));
        if (authzCode.redirect_uri !== redirectUri) return done(new AuthorizationError('Redirect_uri mismatch','invalid_grant'));
                
        tokens.generate(authzCode.grant_id, authzCode.client_id, authzCode.user_id, authzCode.scope, done);
    });
};

