const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

module.exports.myProfileHome = [
    ensureLoggedIn(), 
    function (req, res, next) {
        res.render('myprofile', {
            email: req.user.email,
            title: 'My Profile'
        })
    }
];