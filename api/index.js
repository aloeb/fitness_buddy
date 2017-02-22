var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy

// Config
var conf = require('../config.js');

// Models
var User = require('../models/user');

// Extra files
var corec_data = require('./corec.js')
/* TO GET COREC USAGE DATA AS JSON OBJ:

corec_data.get_current_usage(
    (arg) => {
        console.log(arg)
        next()
    }
);
*/

// This will be called before any route is called. We can do authentication stuff here
router.use((req, res, next) => {
    if (req.url.substring(0,14) === '/auth/facebook') {
        next();
    } else {
        var user_id = req.body.token;
        User.findOne({ 'fb_id': user_id}, (err, user) => {
            if (err) {
                res.status(403).json({
                    message: 'Error: Database access'
                });
            }
            else if (user === null) {
                res.status(403).json({
                    message: 'Error: authentication failed'
                });
            }
            else {
                // Account already exists
                next()
            }
        });
    }
});

passport.use(new FacebookStrategy({
        clientID: conf.FB_APP_ID,
        clientSecret:conf.FB_APP_SECRET,
        callbackURL: 'http://localhost:8081/api/v1/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
        done(null, profile);
    }
));

// These don't work yet, but they will be how we login with facebook
router.route('/auth/facebook').get(passport.authenticate('facebook'));

router.route('/auth/facebook/callback').get(
    passport.authenticate('facebook', {
        session: false
    }),
    (req, res) => {
        user_id = req.user.id
        User.findOne({ 'fb_id': user_id}, (err, user) => {
            if (err) {
                res.status(403).json({
                    message: 'Error: Database access'
                });
            }
            else if (user === null) {
                // Create user
                var newAccount = User();
                newAccount.fb_id = user_id;
                newAccount.name = req.user.displayName;

                newAccount.save((err) => {
                    if (err) {
                        res.status(403).json({
                            error: err,
                            message: 'Error: Account creation failed'
                        });
                    }
                    else {
                        res.status(200).redirect('/?token=' + user_id);
                    }
                });
            }
            else {
                // Account already exists, so we're done
                res.status(200).redirect('/?token=' + user_id);
            }
        });
    }
);

module.exports = router;