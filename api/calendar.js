var google = require('googleapis');
var googleAuth = require('google-auth-library');

var conf = require('../config.js');

var User = require('../models/user');
var Calendar = require('../models/calendar');

var cal_access = new Object()

get_credentials = function(user_id, cb) {
	User.findOne({ fb_id: user_id })
        .populate('calendar')
        .exec(function(err, user) {
        	if (err || !user) { cb(null) }
        	else {
        		if (!user.calendar) {
        			cb(null)
        			return
        		}
        		// Create a google auth object
        		var auth_obj = new googleAuth();
				var oauth2Client = new auth_obj.OAuth2(conf.GOOD_APP_ID, conf.GOOG_APP_SECRET, conf.GOOG_AUTH_REDIRECT_URL);

				creds = {}
        		creds.access_token = user.calendar.accessToken
        		creds.refresh_token = user.calendar.refreshToken
        		creds.id = user.calendar.accountId
        		creds.expiry = user.calendar.expiry

				oauth2Client.credentials = creds;

				// If our access token has expired, let's get a new one
				if (creds.expiry < new Date().getTime()) {
					console.log('UPDATING WITH REFRESH TOKEN')
				    oauth2Client.refreshAccessToken(function(err, tokens) {
				    	//console.log(auth);
				      	//console.log(err);
				      	//console.log(tokens);
				      	if (err) {
				        	console.log(err)
				        	cb(oauth2Client);
				      	} else {
				      		console.log('GOT REFRESHED')
				      		console.log(tokens)
				      		console.log('old:')
				      		console.log(oauth2Client.credentials)
				        	oauth2Client.credentials = tokens;
				        	user.calendar.accessToken = tokens.access_token
				        	user.calendar.save(function(err) {
			                    if (err) {
			                        console.log(err)
			                        cb(oauth2Client)
			                    }
			                    else {
			                    	console.log('SAVED NEW CREDENTIALS')
					                cb(oauth2Client)
			                    }
			                });
				      	}
				      
				    });
				} else {
					// Otherwise just return it
				    cb(oauth2Client);
				}
        	}
    	}
    );
}

/*
Returns the users next 10 events.

If api error or no events, returns an empty array.

If user hasn't authorized Google yet, returns null.

All stuff returned in callback function cb
*/
cal_access.get_user_calendar = function(user_id, start_date, end_date, cb) {
	get_credentials(user_id, (creds) => {
		if (!creds) { cb(null) }
		else {
			var calendar = google.calendar('v3');
			calendar.events.list({
			    auth: creds,
			    calendarId: 'primary',
			    timeMin: start_date,
			    timeMax: end_date,
			    maxResults: 100,
			    singleEvents: true,
			    orderBy: 'startTime',
			}, function(err, response) {
			    if (err) {
			      	console.log('The API returned an error: ' + err);
			      	cb([])
			    } else {
			    	var events = response.items;
			    	cb(events)
			    }
			});
		}
	});
}

/*
	Creates an event on the users calendar, well probably a workout, not an event
*/
cal_access.set_event = function(user_id, start_time, end_time, cb) {
	get_credentials(user_id, (creds) => {
		if (!creds) { cb(null) }
		else {
			var calendar = google.calendar('v3');
			calendar.events.insert({
				auth: creds,
				calendarId: 'primary',
				resource: {
					start: {dateTime:start_time},
					end: {dateTime:end_time},
					summary: "Fitness Buddy Workout"
				}
			}, function(err, response) {
				if (err) {
			      	console.log('The API returned an error: ' + err);
			      	cb(false)
			    } else {
			    	cb(true)
			    }
			})
		}
	})
}


module.exports = cal_access