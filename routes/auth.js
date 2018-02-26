const express = require('express');
const router = express.Router();
const login = require('../lib/auth/login');
const signup = require('../lib/auth/signup');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const myprofile = require('../lib/myprofile');

// identifier first login support
router.post('/login', login.emailFirst);
// for logging in with username/password
router.post('/authenticate/:strategy', login.authenticate);
// for redirecting to a federated idp
router.get('/authenticate/:strategy', login.authenticate);
// federated idp callback
router.get('/login/callback', login.loginCallback);
router.get('/login', login.loginPage);
router.get('/linking', login.linking);
router.get('/signup', signup.signupPage);
router.post('/signup', signup.signup);

router.get('/myprofile', myprofile.myProfileHome);

router.get('/', function(req, res, next) {
    res.send('For more information: <a href="https://github.com/jhiner/zee">https://github.com/jhiner/zee</a>');
});

module.exports = router;