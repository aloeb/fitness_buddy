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
			var full_data = ''
			res.on('data', function (data) {
				full_data = full_data + data
			});
			res.on('end', () => {
				cb(JSON.parse(full_data));
			});
		}).on('error', (e) => { console.log("error: "); console.log(e); });
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
		wo.completed_on = new Date(date)
		wo.save((err, saved) => {
			if (err) {
                cb(false)
            } else {
            	console.log(user)
            	user.workouts += [saved._id]
            	user.save((err) => {
            		if (err) {
            			cb(false)
            		} else {
            			cb(true, saved._id)
            		}
            	});
            }
		});
	});
}

corec.get_workouts = function(user_id, cb) {
	User.findOne({ 'fb_id': user_id })
		.populate({ path: 'workouts', populate: { path: 'routine' } })
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
		ex.save((err, saved) => {
			if (err) {
                cb(false)
            } else {
                cb(true, saved._id)
            }
		})
	});
}

corec.get_exercises = function(user_id, filters, cb) {
	var query = {}
	if (filters) {
		if ('types' in filters) {
			query['tags'] = { $in: filters['types'] }
		}
	}
	Exercise.find(query, (err, exercises) => {
		if (err) {
			cb([])
		} else {
			cb(exercises)
		}
	});
}

corec.get_routines = function(user_id, filters, cb) {
	var query = {}
	var waiting = false
	var finish = (query) => {
		Routine.find(query, (err, routines) => {
			if (err) {
				cb([])
			} else {
				cb(routines)
			}
		});
	}
	if (filters) {
		if ('tags' in filters) {
			query['tags'] = { $in: filters['tags'] }
		}
		if ('rec' in filters && filters['rec']) {
			waiting = true
			User.findOne({ 'fb_id': user_id})
			.populate({ path: 'workouts', populate: { path: 'routine' } })
			.exec((err, user) => {
				if (err) {
					return
				}
				var compare = []
				var rec1 = {completed_on: 0}
				var rec2 = {completed_on: 0}
				var rec3 = {completed_on: 0}
				user.workouts.forEach((wo) => {
					if (wo.completed_on > rec1.completed_on) {
						rec2 = rec1
						rec1 = wo
					} else if (wo.completed_on > rec2.completed_on) {
						rec3 = rec2
						rec2 = wo
					} else if (wo.completed_on > rec3.completed_on) {
						rec3 = wo
					}
				})
				if ('routine' in rec1) {
					rec1.routine.tags.forEach((tag) => {
						compare.push(tag)
					})
				}
				if ('routine' in rec2) {
					rec2.routine.tags.forEach((tag) => {
						compare.push(tag)
					})
				}
				if ('routine' in rec3) {
					rec3.routine.tags.forEach((tag) => {
						compare.push(tag)
					})
				}
				query['tags'] = { $in: compare }
				finish(query)
			});
		}
	}
	if (!waiting) { finish(query) }
	
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