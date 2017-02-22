var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy

// Config
var conf = require('../config.js');

// Models
var User = require('../models/user');

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
                            res.status(200).redirect('/?id=' + user_id);
                        }
                    });
                }
                else {
                    // Account already exists, so we're done
                    res.status(200).redirect('/?id=' + user_id);
                }
            });
        });

/*
router.route('/users/test').get((req, res) => {
    // Create a new account
    var newAccount = User();
    newAccount.fb_id = 'not_real';
    newAccount.name = 'nickname';

    newAccount.save((err) => {
        if (err) {
            res.status(200).json({
                error: err,
                message: 'Error: Account creation failed'
            });
        }
        else {
            res.status(200).json({
                message: 'Successful account creation'
            });
        }
    });
});

router.route('/users/test2').get((req, res) => {
    // Create a new account
    User.findOne({ 'name': 'nickname'}, (err, user) => {
        if (err) {
            res.status(200).json({
                message: 'Error: Database access'
            });
        }
        else if (user === null) {
            res.status(200).json({
                message: 'No user found'
            });
        }
        else {
            // Account already exists
            res.status(200).json({
                message: 'User found with fb_id ' + user.fb_id
            });
        }
    });
});
*/

// EXAMPLE CREATE ACCOUNT ROUTE. Will need to be changed
router.route('/users/create_account').post((req, res) => {
    var name = req.body.name;
    var username = req.body.username;
	var email = req.body.email;
    var password = req.body.password;

    User.findOne({ 'email': email}, (err, user) => {
        if (err) {
            res.status(403).json({
                message: 'Error: Database access'
            });
        }
        else if (user === null) {
            // Create a new account
            var newAccount = User();
            newAccount.name = name;
            newAccount.username = username;
            newAccount.email = email;
            newAccount.password = password;

            newAccount.save((err) => {
                if (err) {
                    res.status(403).json({
                        error: err,
                        message: 'Error: Account creation failed'
                    });
                }
                else {
                    res.status(200).json({
                        message: 'Successful account creation'
                    });
                }
            });
        }
        else {
            // Account already exists
            res.status(403).json({
                message: 'Error: Account already exists'
            });
        }
    });
});

module.exports = router;