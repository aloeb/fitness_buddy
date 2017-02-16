var express = require('express');
var router = express.Router();
var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var DropboxOAuth2Strategy = require('passport-dropbox-oauth2').Strategy;
var OneDriveStrategy = require('passport-onedrive').Strategy;

// Config
var conf = require('../config.js');

// Models
var User = require('../models/user');

// Create facebook strategy
passport.use(new FacebookOAuthStrategy????????
));

// This will be called before any route is called. We can do authentication stuff here
router.use((req, res, next) => {
    if (true) { // If authentication is successful
        next();
    } else { // Otherwise we failed to authenticate
        res.status(403).json({
            message: 'Error: authentication failed'
        })
    }
});

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