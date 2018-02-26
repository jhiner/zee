const _ = require('lodash');
const utils = require('../utils');
const moment = require('moment');
const db = require('../../db');

const REFRESH_TOKEN_PROPERTIES = ['grant_id', 'token', 'created_at'];
const REFRESH_TOKEN_COLLECTION = 'refresh_tokens';

module.exports.create = function(grant_id, callback) {
    let token = utils.generateRandomString(20);

    let newTokenRecord = {
        token: token, 
        grant_id: grant_id,
        created_at: moment().unix()
    };

    db.get().collection(REFRESH_TOKEN_COLLECTION).insert(newTokenRecord, function(err, result) {
        if (err) return callback(err);
        if (result.insertedCount !== 1) {
            return callback(new Error('Could not insert record'));
        }
        console.log('generating refresh token: ' + token);
        return callback(null, token);
    });   
}

module.exports.findByToken = function(token, callback) {
    db.get().collection(REFRESH_TOKEN_COLLECTION).findOne({ token: token }, function(err, tokenRecord) {
        if (err) return callback(err);
        if (_.isEmpty(tokenRecord)) return callback();
        return callback(null, _.pick(tokenRecord, REFRESH_TOKEN_PROPERTIES));
    });    
}