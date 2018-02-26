const logger = require('winston');

/*
    Complete the request (invoked if we can immediately respond)
*/
module.exports = function completeFunction(req, txn, cb) {
    // this function only fires once we *can* respond
    logger.debug('complete: oauth2 ' + JSON.stringify(txn));
    return cb();
};