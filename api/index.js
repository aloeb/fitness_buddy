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

// TODO: take corec busy into account when reccomending for a time

// This will be called before any route is called. We can do authentication stuff here
router.use((req, res, next) => {
    if (req.url.substring(0,14) === '/auth/facebook' || req.url.substring(0,6) === '/share') {
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
        callbackURL: 'http://localhost:8081/api/v1/auth/facebook/callback',
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
                    newAccount.workouts = []

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


router.route('/users/get_user').post((req, res) => {
    User.findOne({ 'fb_id': req.id}, (err, user) => {
        if (err) {
            res.status(403).json({"nope": "you suck"})
        } else {
            res.status(200).json(user)
        }
    });
});

/*

BEGIN WORKOUT STUFF

WIP - Adam L

*/

/*
Takes body parameter "usage_type" which can take values:

    weeklytrends
    lastupdatedtime
    currentactivity
    locations
    monthlytrends

And takes a "location_id" optionally

*/
router.route('/corec/get_usage').post((req, res) => {
    corec_data.get_usage(req.body.usage_type, req.body.location_id, (data) => {
        res.status(200).json(data)
    });
});

/*
Takes object of form as body parameter "routine":
{
    name: <name of workout routine>,
    tags: [
        <first_tag>,
        <second_tag>,
        ...
    ],
    exercises: [
        <mongo_id_of_first_exercise>,
        <mongo_id_of_second_exercise>,
        ...
    ]
}
*/
router.route('/users/create_routine').post((req, res) => {
    corec_data.create_routine(req.id, req.body.routine, (success, id) => {
        if (success) {
            res.status(200).json({'r_id': id})
        } else {
            res.status(96)
        }
    });
});

/*
Takes two body parameters:
    the id of the workout: 'routine'
    the date to schedule: 'date'
*/
router.route('/users/schedule_workout').post((req, res) => {
    corec_data.schedule_workout(req.id, req.body.routine, req.body.date, (success, wo_id) => {
        if (success) {
            calendar_data.set_event(req.id, new Date(req.body.date), new Date(Date.parse(req.body.date) + (1000*60*90)), (success) => {
                res.status(200).json({'wo_id': wo_id})
            })
        } else {
            res.status(404).json({'failed': 'failed'})
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
    corec_data.create_exercise(req.id, req.body.exercise, (success, ex_id) => {
        if (success) {
            res.status(200).json({'ex_id': ex_id})
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
Call this at the end of a workout to get the workout id and the user id
to pass to /share/workout when you want to get the info for the share 
screen.

Takes a body parameter "workout" with the workout id

Returns the workout id as "workout" and the user id as "user"
*/
router.route('/users/share_workout').post((req,res) => {
    User.findOne({'fb_id': req.id}, (err, user) => {
        if (err) {
            res.status(200).json({success: false})
        }
        res.status(200).json({workout: req.body.workout, 
                              user: user._id})
    })
})

/*
Doesn't require authentication

Send "workout" and "user" in the body

Returns the "date" completed, the "name" of the workout, and the 
"user_name" of the user
*/
router.route('/share/workout').post((req, res) => {
    workout_id = req.body.workout
    user_id = req.body.user
    corec_data.share_workout(user_id, workout_id, (obj)=> {
        res.status(200).json(obj)
    })
})

/*
Gets routines. Basically all of them.

Add the parameter "filters" of the following form:
{
    rec: <true_false>,
    date: <RFC3339 timestamp with mandatory time zone offset>,
    tags: [ tag1, tag2, ... ]
}
*/
router.route('/users/get_routines').post((req, res) => {
    corec_data.get_routines(req.id, req.body.filters, (routines) => {
        res.status(200).json(routines)
    });
})

/*
Will have ability to take parameters to filter, but for now
returns all exercises.

Add the parameter "filters" of the following form:
{
    rec: <true_false>,
    types: [ core, legs, ... ]
}
*/
router.route('/users/get_exercises').post((req, res) => {
    corec_data.get_exercises(req.id, req.body.filters, (exercises) => {
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
        scope: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/plus.login'],
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

        User.findOne({ 'fb_id': req.id }, function(err, user) {
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

{
    start_time: <RFC3339 timestamp with mandatory time zone offset>,
    end_time: <RFC3339 timestamp with mandatory time zone offset>
}

*/

router.route('/users/get_calendar').post((req, res) => {
    calendar_data.get_user_calendar(req.id, req.body.start_time, req.body.end_time, (events) => {
        res.json({ 'events': events });
    });
})

/*
    Get reccomended workout time

    {
        start_time: <RFC3339 timestamp with mandatory time zone offset>,
        end_time: <RFC3339 timestamp with mandatory time zone offset>
    }
*/
router.route('/users/get_rec_workout_times').post((req, res) => {
    calendar_data.get_user_calendar(req.id, req.body.start_time, req.body.end_time, (events) => {
        //res.json({ 'events': events });

        enough_time = function(first, second) {
            return (second - first)/(1000*60) >= 90
        }

        suggestions = []
        latest_end = null
        events.forEach((event) => {
            start = Date.parse(event.start.dateTime)
            end = Date.parse(event.end.dateTime)

            if (!latest_end) {
                latest_end = end
                if (enough_time(Date.parse(req.body.start_time), start)) {
                    suggestions.push(new Date(start-(90*60*1000)))
                }
            } else {
                if (enough_time(latest_end, start)) {
                    suggestions.push(new Date(latest_end))
                }

                if (end > latest_end) {
                    latest_end = end
                }
            }
        });
        if (latest_end && enough_time(latest_end, Date.parse(req.body.end_time))) {
            suggestions.push(new Date(latest_end))
        }

        res.json({'suggestions': suggestions})
    });
})



module.exports = router;