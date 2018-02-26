const _ = require('lodash');
const db = require('../../db');

// http://openid.net/specs/openid-connect-registration-1_0.html#ClientMetadata
const CLIENT_PROPERTIES = [
    'client_id',
    'client_secret',
    'client_name',
    'redirect_uris',
    'post_logout_redirect_uris',
    'response_types',
    'grant_types',
    'application_type',
    'contacts',
    'logo_uri',
    'client_uri',
    'policy_uri',
    'tos_uri',
    'jwks_uri',
    'jwks',
    'sector_identifier_uri',
    'subject_type',
    'id_token_signed_response_alg',
    'id_token_encrypted_response_alg',
    'id_token_encrypted_response_enc',
    'userinfo_signed_response_alg',
    'userinfo_encrypted_response_alg',
    'userinfo_encrypted_response_enc',
    'request_object_signing_alg',
    'request_object_encryption_alg',
    'request_object_encryption_enc',
    'token_endpoint_auth_method',
    'token_endpoint_auth_signing_alg',
    'default_max_age',
    'require_auth_time',
    'default_acr_values',
    'initiate_login_uri',
    'request_uris'
];
const CLIENTS_COLLECTION = 'clients';

module.exports.findById = function(client_id, callback) {
    db.get().collection(CLIENTS_COLLECTION).findOne({ client_id: client_id }, function(err, result) {
        if (err) return callback(err);
        if (_.isEmpty(result)) return callback();
        return callback(null, _.pick(result, CLIENT_PROPERTIES));
    });    
}