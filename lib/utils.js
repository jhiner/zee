const randomstring = require('randomstring');
const _ = require('lodash');

module.exports.generateRandomString = function (len) {
    return randomstring.generate({
        charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
    });
}

module.exports.offlineAccessScope = function(scope) {
    return scope.indexOf('offline_access') > -1;
}

module.exports.openIdScope = function(scope) {
    return scope.indexOf('openid') > -1;
}

module.exports.mapOpenIDConnectClaims = mapOpenIDConnectClaims;

function mapOpenIDConnectClaims(user) {
    // take the user object and return a mapped set of oidc compliant claims
    let mapping = {
        user_id: 'sub',
        email: 'email',
        first_name: 'given_name',
        last_name: 'family_name',
        nickname: 'nickname',
        full_name: 'name',
        middle_name: 'middle_name',
        preferred_username: 'preferred_username',
        profile_page: 'profile',
        picture: 'picture',
        website: 'website',
        email_verified: 'email_verified',
        gender: 'gender',
        birthdate: 'birthdate',
        timezone: 'zoneinfo',
        locale: 'locale',
        phone_number: 'phone_number',
        phone_number_verified: 'phone_number_verified',
        address: 'address',
        updated_at: 'updated_at'
    };

    // for each attribute user[mapping.key], return a new object with key mapping.value
    let mappedUser = {};
    Object.keys(mapping).forEach(key => {
        if (user[key]) {
            mappedUser[mapping[key]] = user[key];
        }
    });
    
    return mappedUser;
}

module.exports.scopedProfile = function(user, scope) {

    const OPENID_PROFILE_CLAIMS = ['name', 'family_name', 'given_name', 'middle_name', 'nickname', 'preferred_username', 'profile', 'picture', 'website', 'gender', 'birthdate', 'zoneinfo', 'locale', 'updated_at'];
    const OPENID_EMAIL_CLAIMS = ['email', 'email_verified'];
    const OPENID_ADDRESS_CLAIMS = ['address'];
    const OPENID_PHONE_CLAIMS = ['phone_number', 'phone_number_verified'];

    let mappedUser = mapOpenIDConnectClaims(user);

    let scopedUser = {
        sub: mappedUser.sub
    };

    if (scope.indexOf('openid') === -1) {
        return scopedUser;
    }

    if (scope.indexOf('profile') > -1) {
        _.assign(scopedUser, _.pick(mappedUser, OPENID_PROFILE_CLAIMS));
    }

    if (scope.indexOf('email') > -1) {
        _.assign(scopedUser, _.pick(mappedUser, OPENID_EMAIL_CLAIMS));
    }

    if (scope.indexOf('address') > -1) {
        _.assign(scopedUser, _.pick(mappedUser, OPENID_ADDRESS_CLAIMS));
    }

    if (scope.indexOf('phone') > -1) {
        _.assign(scopedUser, _.pick(mappedUser, OPENID_PHONE_CLAIMS));
    }
    
    return scopedUser;
}

module.exports.isAccountLinking = function(session) {
    return (session && session.logintxn && session.logintxn.accountLinking);
};

module.exports.getAccountLinkingSettings = function(session) {
    return (session && session.logintxn && session.logintxn.accountLinking);
};

module.exports.setAccountLinkingSetting = function(session, key, value) {
    let accountLinking = (session && session.accountLinking) || {};
    accountLinking[key] = value;
    session.accountLinking = accountLinking;
    return;
};

module.exports.isPromptConsent = function(prompt) {
    return prompt === 'consent';
};