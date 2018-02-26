const refreshTokens = require('../../db/refreshTokens');
const grants = require('../../db/grants');
const AuthorizationError = require('oauth2orize').AuthorizationError;

module.exports = function(client, refreshToken, scope, done) {
    /*
    *     server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
        *       AccessToken.create(client, refreshToken, scope, function(err, accessToken) {
            *         if (err) { return done(err); }
            *         done(null, accessToken);
            *       });
            *     }));
            */
            // TODO: lookup the refresh token
            // verify the token/grant/etc
            // issue a new access token

    // lookup the refresh token in the db
    refreshTokens.findByToken(refreshToken, function(err, refreshToken) {
        // TODO: handle error
        if (err) return done(err);
        // get the underlying grant
        grants.getById(refreshToken.grant_id, function(err, grant) {
            // TODO: handle error
            if (err) return done(err);
            if (!grant) return done(new AuthorizationError('Grant not found', 'invalid_grant'));

            // grant is valid, issue a new access token and optionally generate a new refresh token
            // TODO: issue refresh token
        });

    });

};