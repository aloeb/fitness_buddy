var https = require('https')

var mongoose = require('mongoose');
var User = require('../models/user');
var Workout = require('../models/workout');
var Exercise = require('../models/exercise');
var History = require('../models/history');
var Routine = require('../models/routine');

var corec = new Object()

corec.get_usage = function(type, loc_id, cb) {
	var url = 'https://www.purdue.edu/DRSFacilityUsageAPI/' + type
	if (loc_id) {
		url = url + '/' + loc_id
	}
	https.get(url,
		(res) => {
			res.setEncoding('utf8');
			res.on('data', function (data) {
			    cb(JSON.parse(data));
			});
		});
}

corec.create_routine = function(user_id, routine, cb) {
	User.findOne({ 'fb_id': user_id}, (err, user) => {
		if (err) {
			cb(false)
			return
		}
		var ro = Routine()
		ro.creator = user._id
		ro.name = routine.name
		ro.tags = routine.tags
		ro.exercises = []
		for (i = 0; i < routine.exercises.length; i++) {
			ro.exercises.push(mongoose.Types.ObjectId(routine.exercises[i]))
		}
		ro.save((err, saved) => {
            if (err) {
                cb(false)
            } else {
                cb(true, saved._id)
            }
        });
	});
}

corec.schedule_workout = function(user_id, routine, date, cb) {
	User.findOne({ 'fb_id': user_id }, (err, user) => {
		if (err) {
			cb(false)
			return
		}
		var wo = Workout()
		wo.routine = mongoose.Types.ObjectId(routine)
		wo.completed_on = date
		wo.save((err, saved) => {
			if (err) {
                cb(false)
            } else {
            	user.workouts.append(saved._id)
            	user.save((err) => {
            		if (err) {
            			cb(false)
            		} else {
            			cb(true)
            		}
            	});
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
		} else {
			cb(user.workouts)
		}
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

corec.get_routines = function(filters, cb) {
	var query = {}
	Routine.find(query, (err, routines) => {
		if (err) {
			cb([])
		} else {
			cb(routines)
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