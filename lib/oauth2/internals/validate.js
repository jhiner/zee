const clients = require('../../db/clients');
const AuthorizationError = require('oauth2orize').AuthorizationError;

/*
    Validate the request
*/
module.exports = function validateFunction(clientID, redirectURI, done) {
    clients.findById(clientID, function(err, client) {
        if (err) return done(err);
        if (!client) return done(new AuthorizationError('Client not found', 'unauthorized_client'));
        if (client.redirect_uris.indexOf(redirectURI) === -1) {
            return done(new AuthorizationError('Redirect uri not in list of registered values', 'invalid_request'));
        }
        
        return done(null, client, redirectURI);
    });  
};
