var https = require('https')

var mongoose = require('mongoose');
var User = require('../models/user');
var Workout = require('../models/workout');
var Exercise = require('../models/exercise');
var History = require('../models/history');

var corec = new Object()

corec.get_current_usage = function(cb) {
	https.get('https://www.purdue.edu/DRSFacilityUsageAPI/currentactivity',
		(res) => {
			res.setEncoding('utf8');
			res.on('data', function (data) {
			    cb(JSON.parse(data));
			});
		});
}

corec.create_workout = function(user_id, workout, cb) {
	User.findOne({ 'fb_id': user_id}, (err, user) => {
		if (err) {
			cb(false)
			return
		}
		var wo = Workout()
		wo.completed_on = workout.date
		wo.exercises = []
		for (i = 0; i < workout.exercises.length; i++) {
			wo.exercises.push(mongoose.Types.ObjectId(workout.exercises[i]))
		}
		wo.save((err) => {
            if (err) {
                cb(false)
            } else {
                cb(true)
            }
        });
	});
}

corec.get_workouts = function(user_id, cb) {
	User.findOne({ 'fb_id': user_id })
		.populate('workouts')
		.exec((err, user) => {
		if (err) {
			cb([])
			return
		}
		cb(user.workouts)
	});
}

corec.create_exercise = function(user_id, exercise, cb) {
	User.findOne({ 'fb_id': user_id}, (err, user) => {
		if (err) {
			cb(false)
			return
		}
		var ex = Exercise()
		ex.name = exercise.name
		ex.description = exercise.description
		ex.gym_area = exercise.area
		ex.type = exercise.type
		ex.popularity = 0
		ex.creator = user._id
		ex.save((err) => {
			if (err) {
                cb(false)
            } else {
                cb(true)
            }
		})
	});
}

corec.get_exercises = function(filters, cb) {
	var query = {}
	Exercise.find(query, (err, exercises) => {
		if (err) {
			cb([])
		} else {
			cb(exercises)
		}
	});
}

corec.get_reccomended_time = function(exercise, calender) {


}

corec.get_location_usage = function(location) {

History.find({'LocationID':location}, (err, hist) => {
    if (err) {
        cb(false)
        return
	}

	cb(hist)
	});
}


module.exports = corec