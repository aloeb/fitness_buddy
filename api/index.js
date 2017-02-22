var express = require('express');
var router = express.Router();
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// Config
var conf = require('../config.js');

// Models
var User = require('../models/user');
var Calendar = require('../models/calendar');

// Extra files
var corec_data = require('./corec.js')
var calendar_data = require('./calendar.js')
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
        if (!user_id) {
            user_id = req.query.state
        }
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
                req.token = user_id
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

router.route('/auth/facebook').get(passport.authenticate('facebook'));

router.route('/auth/facebook/callback').get(
    passport.authenticate('facebook', {
        failureRedirect: '/',
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







/*

BEGIN CALENDAR STUFF

WIP - Adam L

This should store google calendar credentials in the db.

Go to .../api/v1/users/auth_google?state=<user_token> to put user in workflow

*/

// Auth Google Strategy
passport.use(new GoogleStrategy({
        clientID: conf.GOOG_APP_ID,
        clientSecret: conf.GOOG_APP_SECRET,
        callbackURL: 'http://localhost:8081/api/v1/users/auth_google/callback'
    },
    function(accessToken, refreshToken, params, profile, done) {
        var userInfo = {
            accountId: profile.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiry: params.expires_in*1000 + new Date().getTime()
        };
        return done(null, userInfo);
    }
));

router.route('/users/auth_google').get((req, res, next) => {
    passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/plus.login'],
        accessType: 'offline',
        approvalPrompt: 'force',
        state: req.token
    })(req, res, next);
});

router.route('/users/auth_google/callback').get(
    passport.authenticate('google',
        { 
            failureRedirect: '/',
            session: false
        }
    ),
    (req, res) => {
        var userInfo = req.user;

        User.findOne({ 'fb_id': req.query.state }, function(err, user) {
            if (err) {
                res.status(403).json({
                    Error: err
                });
            }
            else {
                var newGoogleAccount = Calendar();
                newGoogleAccount.source = 'google';
                newGoogleAccount.accountId = userInfo.accountId;
                newGoogleAccount.accessToken = userInfo.accessToken;
                newGoogleAccount.refreshToken = userInfo.refreshToken;
                newGoogleAccount.expiry = userInfo.expiry;

                newGoogleAccount.save(function(err) {
                    if (err) {
                        res.status(403).json({
                            Error: err
                        });
                    }
                    else {
                        user.calendar = newGoogleAccount;
                        user.save(function(err) {
                            if (err) {
                                res.status(403).json({
                                    Error: err
                                });
                            } else {
                                //res.json({success: true});
                                res.status(200).redirect('/');
                            }
                        });
                    }
                });
            }
        });

        /*res.json({
            message: 'Successfully authenticated with google drive'
        });*/
    }
);

/*
NOW ACTUAL GETTING CALENDAR STUFF

WIP - Adam L

*/

router.route('/users/get_calendar').post((req, res) => {
    calendar_data.get_user_calendar(req.token, (events) => {
        res.json({ 'events': events });
    });
})



module.exports = router;