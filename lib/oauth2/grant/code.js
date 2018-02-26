const authzCodes = require('../../db/authorizationCodes');
const grants = require('../../db/grants');

// code grant
module.exports = function(client, redirectUri, user, ares, req, locals, done) {
    console.log('grant - code middleware');

    /*
        notes: 
        - this is invoked after consent, or in the case of immediately responding
        - either way, we should pull the grant record in order to generate the authz code,
        since this is essentially a reference to the grant record itself
        // TODO: Is this right? Why is ares.scope undefined in the completed case?
    */
    grants.getByUserClient(user.user_id, client.client_id, function(err, grant) {
        let scope = (ares && ares.scope) || grant.scope;
        // use locals.scope since the current txn might be asking for attenuated scopes compared to the grant record
        authzCodes.create(grant.grant_id, grant.client_id, grant.user_id, scope, redirectUri, function(err, authzCode) {
            console.log('created authz code');
            if (err) return done(err);
            return done(null, authzCode);
        });
    });
};