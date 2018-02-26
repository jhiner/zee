const _ = require('lodash');
const utils = require('../utils');
const db = require('../../db');

const ACCESS_TOKEN_PROPERTIES = ['token', 'client_id', 'user_id', 'scope'];
const ACCESS_TOKEN_COLLECTION = 'access_tokens';

module.exports.create = function(grant_id, client_id, user_id, scope, callback) {
    let token = utils.generateRandomString(20);

    let newTokenRecord = {
        token: token, 
        client_id: client_id,
        user_id: user_id,
        scope: scope,
        grant_id: grant_id
    };

    db.get().collection(ACCESS_TOKEN_COLLECTION).insert(newTokenRecord, function(err, result) {
        if (err) return callback(err);
        if (result.insertedCount !== 1) {
            return callback(new Error('Could not insert record'));
        }
        return callback(null, token);
    });
}

module.exports.findByToken = function(token, callback) {
    db.get().collection(ACCESS_TOKEN_COLLECTION).findOne({token: token}, function(err, result) {
        if (err) return callback(err);
        if (_.isEmpty(result)) return callback();
        return callback(null, _.pick(result, ACCESS_TOKEN_PROPERTIES));
    });
}