var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
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
        var token = req.body.token
        if (!token) {
            token = req.query.state
        }
        jwt.verify(token, conf.TOKEN_SECRET, function(err, decoded) {
            if (err) {
                res.status(403).json({
                    message: 'Error: authentication failed'
                });
            } else {
                req.id = decoded.id
                req.token = token
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
            } else {
                var token = jwt.sign({ id: user_id }, conf.TOKEN_SECRET, {
                    expiresIn: '30 days'
                });
                if (user === null) {
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
                            res.status(200).redirect('/?token=' + token);
                        }
                    });
                }
                else {
                    // Account already exists, so we're done
                    res.status(200).redirect('/?token=' + token);
                }
            }
        });
    }
);


/*

BEGIN WORKOUT STUFF

WIP - Adam L

*/

/*
Takes object of form as body parameter "workout":
{
    date: <date_completed_or_scheduled>,
    exercises: [
        <mongo_id_of_first_exercise>,
        <mongo_id_of_second_exercise>,
        ...
    ]
}
*/
router.route('/users/create_workout').post((req, res) => {
    corec_data.create_workout(req.id, req.body.workout, (success) => {
        if (success) {
            res.status(200)
        } else {
            res.status(96)
        }
    });
});

/*
Takes object of form as body parameter "exercise":
{
    name: <exercise_name>,
    description: <exercise_description_or_instructions>,
    area: <part_of_corec>,
    type: <type_of_workout_maybe_like_legs_or_bicepts>
}
*/
router.route('/users/create_exercise').post((req, res) => {
    corec_data.create_exercise(req.id, req.body.exercise, (success) => {
        if (success) {
            res.status(200)
        } else {
            res.status(96)
        }
    });
});

/*
Get's all past and future completed and scheduled workouts 
for a particular user.
*/
router.route('/users/get_workouts').post((req, res) => {
    corec_data.get_workouts(req.id, (workouts) => {
        res.status(200).json(workouts)
    });
})

/*
Will have ability to take parameters to filter, but for now
returns all exercises.
*/
router.route('/users/get_exercises').post((req, res) => {
    corec_data.get_exercises(null, (exercises) => {
        res.status(200).json(exercises)
    });
});




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
    calendar_data.get_user_calendar(req.id, (events) => {
        res.json({ 'events': events });
    });
})



module.exports = router;