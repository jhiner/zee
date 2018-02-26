const express = require('express');
const router = express.Router();
const passport = require('passport');
const LocalStrategy = require('passport-local');
const GitHubStrategy = require('passport-github').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const users = require('../db/users');
const uuidv4 = require('uuid/v4');
const moment = require('moment');
const _ = require('lodash');
const utils = require('../utils');
const bcrypt = require('bcryptjs');

// used to serialize the user for the session
passport.serializeUser(function(user, done) {
  console.log('serializeUser');
  done(null, user.user_id);
});

// used to deserialize the user
passport.deserializeUser(function(user_id, done) {
  console.log('deserializeUser');
  users.findById(user_id, function(err, user) {
      if (err) return done(err);
      return done(null, user);
  });
  
});

passport.use(new LocalStrategy({
    passReqToCallback: true
}, function(req, username, password, done) {
    users.findByEmailAndComparePassword(username, password, function(err, user) {
        if (err) return done(null, false, req.flash('loginErrorMessage', err.message));

        if (!user) return done(null, false, req.flash('loginErrorMessage', 'Invalid credentials'));

        console.log('Found local user: ' + user.user_id);
        
        // set auth time
        req.session.auth_time = moment().unix();

        if (!utils.isAccountLinking(req.session)) {
            // if we don't need to link this account, just return
            return done(null, user);
        }

        let accountLinking = utils.getAccountLinkingSettings(req.session);

        // now that we have logged in, link the account
        // create federated account link
        users.linkFederatedAccount(user.user_id, accountLinking.federated_id, accountLinking.provider, function(err, fedUser) {
            if (err) return done(err);
            // only clear this flag once this is definitely a valid user
            delete req.session.logintxn.accountLinking;
            // return the local user
            return done(null, user);
        });
    });
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/login/callback',
    state: true,
    passReqToCallback: true,
    scope: ['user:email'],
    sessionKey: 'passport-github'
  },
  function(req, accessToken, refreshToken, profile, done) {

    let primaryEmail = profile.emails.find(email => {
        return email.primary === true;
    });

    if (!primaryEmail) return done(null, false, req.flash('Github account does not have a primary email address'));

    primaryEmail = primaryEmail.value.toLowerCase();

    findLocalUserAndInitiateAccountLinking(req, 'github', profile.id, primaryEmail, done);
  }
));

function findLocalUserAndInitiateAccountLinking(req, provider, federated_id, email, done) {
    // find the local user account
    // profile.id is the federated identifier
    users.findByFederatedId(provider, federated_id, function(err, user) {
        if (err) return done(err);

        console.log('Found federated user record? ' + !!user);

        // if the local account exists and is already linked with this federated id, nothing more to do here.
        if (user) return done(null, user);

        // if not, check to see if the user exists and needs to be linked
        users.findByEmail(email, function(err, user) {
            if (err) return done(err);

            // local user does not already exist
            if (!user) return createAndLinkUser(email, federated_id, provider, done);

            console.log('The user already exists and must be linked');
            console.log('Local user id: ' + user.user_id);
            console.log('Federated user id: ' + federated_id);

            // if the user exists, do the account linking
            // this sets up the information about the acct linking within the session
            let logintxn = (req.session && req.session.logintxn) || {};
            logintxn.accountLinking = {
                link: true,
                provider: provider,
                username: email,
                federated_id: federated_id,
                returnTo: req.session.returnTo
            };

            req.session.logintxn = logintxn;

            // TODO: not super ideal here, because we are setting the user to the local account before officially linking
            // This should be reviewed.
            return done(null, user);

        });

    });
}

function createAndLinkUser(email, federated_id, federatedProvider, done) {
    users.create(email, uuidv4(), {}, function(err, user) {
        if (err) return done(err);

        // create federated account link
        users.linkFederatedAccount(user.user_id, federated_id, federatedProvider, function(err, fedUser) {
            if (err) return done(err);

            // return the local user
            return done(null, user);
        });
    });
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/login/callback',
    state: true,
    passReqToCallback: true,
    sessionKey: 'passport-google'
  },
  function(req, accessToken, refreshToken, profile, done) {

    /*
        "emails": [
        {
            "value": "foobar@gmail.com",
            "type": "account"
        }
    ],
    */
    let googleEmail = profile.emails.filter(email => {
        return email.type === 'account';
    });

    if (!googleEmail) return done(null, false, req.flash('loginErrorMessage', 'Google account does not have a valid email.'));

    findLocalUserAndInitiateAccountLinking(req, 'google', profile.id, googleEmail[0].value, done);
}));

module.exports.loginCallback = [
    function authenticateByStrategy(req, res, next) {
        let strategy = req.session.logintxn.strategy;

        return passport.authenticate(strategy, { 
            failureRedirect: '/login',
            failureFlash: true,
            successReturnToOrRedirect: '/myprofile'
        })(req, res, next);
    }
];

module.exports.authenticate = [
    // TODO: Rate limit
    function authenticateByStrategy (req, res, next) {
        // TODO Sanitize input
        let strategy = req.params.strategy;

        if (!strategy) return next(new Error('Invalid strategy'));

        // we'll use the strategy when we come back to /login/callback
        // TODO: don't we always have req.session here?
        console.log('authenticate');
        logintxn = req.session.logintxn || {};
        logintxn.strategy = strategy;
        req.session.logintxn = logintxn;

        let options = {};

        options.failureRedirect = '/login';
        options.successReturnToOrRedirect = '/myprofile'; // TODO: setup my profile page
        options.failureFlash = true;

        if (logintxn.accountLinking) {
            // set the failure to account linking page
            options.failureRedirect = '/linking';
        }

        // add strategy-specific options
        if (strategy === 'google') {
            options.scope = ['email profile']
        }

        if (strategy === 'github') {
            options.userAgent = 'Zee';
        }

        return passport.authenticate(req.params.strategy, options)(req, res, next);
    }
];

module.exports.emailFirst = [
    // TODO: Rate limit
    // This supports identifier first login:
    // - if we find the domain is in a domain of an external idp, redirect there
    // - otherwise show the password screen
    // get the strategy on the login endpoint
    function checkEmailDomain(req, res, next) {
        let email = req.body && req.body.username;      

        // this only rule we have so far is gmail.com redirects to google. there could be others here
        if (email.indexOf('gmail.com') > -1) {
            // Automatically go to google
            // TODO: login hint at idp
            return res.redirect('/authenticate/google');
        }

        // TODO: optionally check the existence of the email address
        // if a user account exists for this username, 
        // IFF the server is configured to do it (some may disable it to reduce leakage)

        return next();
    },
    showPasswordPage
];

// prompt the password page to handle account linking
module.exports.linking = [
    showAccountLinkingPage
];

function showAccountLinkingPage(req, res, next) {
    console.log('--- Account linking page ---');

    let accountLinking = utils.getAccountLinkingSettings(req.session);
    let provider = (accountLinking && accountLinking.provider);

    if (!accountLinking) return res.status(404).send('Not found');

    // showing the account linking page, requires the username
    req.body.username = accountLinking.username;

    return res.render('login-account-link', { 
        title: 'Link Your Account',
        csrfToken: req.csrfToken(),
        username: req.body.username,
        provider: provider,
        message: req.flash('loginErrorMessage')
    });
}

function showPasswordPage(req, res, next) {
    // show the password prompt
    console.log('--- Password page ---');
    console.log(req.session);
    return res.render('login-password', { 
        title: 'Login',
        csrfToken: req.csrfToken(),
        username: req.body.username,
        message: req.flash('loginErrorMessage')
    });
}

// login page
module.exports.loginPage = [
    function(req, res, next) {
        res.render('login', { 
          title: 'Login',
          csrfToken: req.csrfToken(),
           message: req.flash('loginErrorMessage')
        });
    }
];