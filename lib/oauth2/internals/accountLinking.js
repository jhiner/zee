const utils = require('../../utils');

module.exports = function handleAccountLinking(req, res, next) {
    // Check to see if we need to link accounts. 
    // If so, redirect to password prompt
    console.log('--- handle account linking ---');

    if (utils.isAccountLinking(req.session)) {
        // this is needed on the account linking page
        utils.setAccountLinkingSetting(req.session, 'username', req.user.email);
        utils.setAccountLinkingSetting(req.session, 'federated_id', req.user.id);

        // this was originally set in the password verify callback
        req.session.returnTo = req.session.logintxn.accountLinking.returnTo;
        return res.redirect('/linking');
    }

    // if nothing else, clear the logintxn in session
    delete req.session.logintxn;
    
    return next();
};