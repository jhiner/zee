const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const bcrypt = require('bcryptjs');
const db = require('../../db');

// TODO: add them all (See the mapping)
const USER_PROPERTIES = ['user_id', 'email', 'first_name', 'last_name', 'nickname'];
const FEDERATED_USER_PROPERTIES = ['provider', 'sub', 'local_user_id'];

module.exports.linkFederatedAccount = function(local_user_id, federated_id, provider, callback) {
    let federatedUserRecord = {
        provider: provider,
        sub: ''.concat(federated_id),
        local_user_id: local_user_id
    };

    console.log('creating federated user record');
    console.log(federatedUserRecord);

    db.get().collection('federated_users').insert(federatedUserRecord, function(err, result) {
        if (err) return callback(err);
        if (result.insertedCount !== 1) {
            return callback(new Error('Could not insert record'));
        }
        return callback(null, _.pick(federatedUserRecord, FEDERATED_USER_PROPERTIES));
    });
}

module.exports.create = function(email, password, properties, callback) {

    // let's only support pre-defined properties on the schema
    properties = _.pick(properties, USER_PROPERTIES);

    // hash the password
    bcrypt.genSalt(10, function(err, salt) {
        // TODO: err ^?
        bcrypt.hash(password, salt, function(err, hash) {
            let userRecord = properties;
            userRecord.user_id = uuidv4();
            userRecord.email = email;
            userRecord.password = hash;
            
            db.get().collection('users').insert(userRecord, function(err, result) {
                if (err) return callback(err);
                if (result.insertedCount !== 1) {
                    return callback(new Error('Could not insert record'));
                }
                return callback(null, _.pick(userRecord, USER_PROPERTIES));
            });
            
        });
    });

};

function findById(user_id, callback) {
    db.get().collection('users').findOne({ user_id: user_id }, function(err, userRecord) {
        if (err) return callback(err);
        if (_.isEmpty(userRecord)) return callback();
        return callback(null, _.pick(userRecord, USER_PROPERTIES));
    });
};

module.exports.findById = findById;

module.exports.findByEmail = function(email, callback) {
    // TODO: Email is assumed to be unique, ok?
    db.get().collection('users').findOne({ email: email }, function(err, userRecord) {
        if (err) return callback(err);
        if (_.isEmpty(userRecord)) return callback();
        return callback(null, _.pick(userRecord, USER_PROPERTIES));
    });
};

module.exports.findByEmailAndComparePassword = function(email, password, callback) {
    // TODO: Email is assumed to be unique, ok?
    db.get().collection('users').findOne({ email: email }, function(err, userRecord) {
        if (err) return callback(err);
        if (_.isEmpty(userRecord)) return callback();

        bcrypt.compare(password, userRecord.password, function(err, match) {
            if (!match) return callback();
            return callback(null, _.pick(userRecord, USER_PROPERTIES));
        });
    });
};

module.exports.findByFederatedId = function(provider, federated_id, callback) {

    console.log('searching for federated user record');
    console.log(provider + ':' + federated_id);

    db.get().collection('federated_users').findOne({ 
        provider: provider,
        sub: federated_id
    }, function(err, federatedUserRecord) {
        if (err) return callback(err);
        if (!federatedUserRecord) return callback();

        // get the actual user record
        findById(federatedUserRecord.local_user_id, function (err, userRecord) {
            if (err) return callback(err);

            console.log('Found local user record? ' + !!userRecord);
            if (_.isEmpty(userRecord)) return callback();
            return callback(null, _.pick(userRecord, USER_PROPERTIES));
        });

    });
};