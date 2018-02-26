const utils = require('../../utils');
const grants = require('../../db/grants');
const AuthorizationError = require('oauth2orize').AuthorizationError;
const _ = require('lodash');

/*
    Determine if we can respond immediately
*/
module.exports = function immediateResponseFunction(client, user, scope, type, txn, locals, done) {

    if (utils.isPromptConsent(txn.prompt)) {
        return done(null, false, info, locals);
    }

    // lookup the grant
    grants.getByUserClient(user.user_id, client.client_id, function(err, grant) {
        if (err) return done(new AuthorizationError(err.message));

        let info = {};
        info.scope = scope;
        let locals = {};

        // grant does not exist, so prompt for consent
        if (!grant) return done(null, false, info, locals);

        locals.grant_id = grant.grant_id;

        // if the grant was found, let us compare the scopes
        console.log('Request scope: ' + scope);
        console.log('Granted scope: ' + grant.scope);

        // if requested scope is greater than granted scope, then prompt for consent
        // create an array of scopes in the request but not in the grant
        let difference = _.without(scope, ...grant.scope);
        
        if (difference.length > 0) {
            console.log('immediate result: do consent');
            return done(null, false, info, locals);
        }

        console.log('immediate result: complete now');
        return done(null, true, info, locals);
    });

};