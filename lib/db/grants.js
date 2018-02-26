const uuidv4 = require('uuid/v4');
const _ = require('lodash');
const db = require('../../db');
const moment = require('moment');

const GRANT_PROPERTIES = ['grant_id', 'user_id', 'client_id', 'scope'];
const GRANTS_COLLECTION = 'grants';

module.exports.upsert = function(user_id, client_id, scope, callback) {

    // For now, we just delete this grant and re-create it
    deleteByUserClient(user_id, client_id, function (err) {
        if (err) return callback(err);

        let newGrant = {
            grant_id: uuidv4(),
            user_id: user_id,
            client_id: client_id,
            scope: scope,
            created_at: moment().unix()
        };
    
        db.get().collection(GRANTS_COLLECTION).insert(newGrant, function(err, result) {
            if (err) return callback(err);
            if (result.insertedCount !== 1) {
                return callback(new Error('Could not insert record'));
            }
            return callback(null, _.pick(newGrant, GRANT_PROPERTIES));
        });
    });
}

function deleteByUserClient(user_id, client_id, callback) {
    // TODO Find matching grant by user_id, client_id, scope
    db.get().collection(GRANTS_COLLECTION).findOneAndDelete({ user_id: user_id, client_id: client_id }, function(err, result) {
        if (err) return err;
        return callback();
    });
}

module.exports.getByUserClient = function(user_id, client_id, callback) {
    getOneRecord({ user_id: user_id, client_id: client_id }, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
}

module.exports.getByUserClientScope = function(user_id, client_id, scope, callback) {
    let grant = grants.find(grant => {
        return grant.user_id === user_id && grant.client_id === client_id;
    });

    getOneRecord({ user_id: user_id, client_id: client_id }, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
}

module.exports.getById = function(grant_id, callback) {
    getOneRecord({ grant_id: grant_id }, function(err, result) {
        if (err) return callback(err);
        return callback(null, result);
    });
}

function getOneRecord(query, callback) {
    if (!query) return callback();

    db.get().collection(GRANTS_COLLECTION).findOne(query, function(err, result) {
        if (err) return callback(err);
        if (_.isEmpty(result)) return callback();
        return callback(null, _.pick(result, GRANT_PROPERTIES));
    });
}