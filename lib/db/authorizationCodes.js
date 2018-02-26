const _ = require('lodash');
const utils = require('../utils');
const db = require('../../db');

const AUTHORIZATION_CODE_PROPERTIES = ['grant_id', 'code', 'client_id', 'user_id', 'scope', 'redirect_uri'];
const AUTHORIZATION_CODE_COLLECTION = 'authorization_codes';

module.exports.create = function(grant_id, client_id, user_id, scope, redirect_uri, callback) {
    let authzCode = utils.generateRandomString(10);

    let codeRecord = {
        code: authzCode,
        client_id: client_id,
        user_id: user_id,
        scope: scope,
        redirect_uri: redirect_uri,
        grant_id: grant_id
    };

    db.get().collection(AUTHORIZATION_CODE_COLLECTION).insert(codeRecord, function(err, result) {
        if (err) return callback(err);
        if (result.insertedCount !== 1) {
            return callback(new Error('Could not insert record'));
        }
        return callback(null, authzCode);
    });
};

module.exports.findAndDeleteByCode = function(code, callback) {
    db.get().collection(AUTHORIZATION_CODE_COLLECTION).findOneAndDelete({ code: code }, function(err, result) {
        if (err) return err;
        return callback(null, _.pick(result.value, AUTHORIZATION_CODE_PROPERTIES));
    });
}