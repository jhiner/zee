const users = require('../db/users');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const ensureLoggedOut = require('connect-ensure-login').ensureLoggedOut;
const _ = require('lodash');

passport.use('local-signup', new LocalStrategy({
    passReqToCallback : true,
}, function(req, username, password, done) {
    // TODO: check for collision

    users.findByEmail(username, function(err, user) {
        if (err) {
            console.log('Error while signing up');
            console.log(err);
            // TODO: better error handling
            return done(null, false, req.flash('signupErrorMessage', 'Server error'));
        }
        // TODO: does this leak too much?
        if (user) return done(null, false, req.flash('signupErrorMessage', 'User already exists'));

        users.create(username, password, { nickname: username }, function(err, user) {
            if (err) return next(err);
            console.log('User created: ' + JSON.stringify(user));
            return done(null, user);
        });
    });
}));

module.exports.signup = [
    // TODO Rate limit
    ensureLoggedOut(),
    function validate(req, res, next) {
        // TODO: validate and sanitize input
        console.log('Validate signup input: ' + JSON.stringify(req.body));
        return next();
    },
    passport.authenticate('local-signup', {
        failureRedirect: '/signup',
        successReturnToOrRedirect: '/myprofile',
        failureFlash: true
    })
];

// signup page
module.exports.signupPage = [
    function(req, res, next) {
        res.render('signup', { 
          title: 'Sign Up',
          csrfToken: req.csrfToken(),
          signupErrorMessage: req.flash('signupErrorMessage')
        });
    }
];
