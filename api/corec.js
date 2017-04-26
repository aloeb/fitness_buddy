var https = require('https')

var mongoose = require('mongoose');
var User = require('../models/user');
var Workout = require('../models/workout');
var Exercise = require('../models/exercise');
var History = require('../models/history');
var Routine = require('../models/routine');

var corec = new Object()

var tag_to_loc = {
	"legs": ["45f053e9-67ed-48f2-bcf6-c03b86f1e261"],
	"core": ["b100914b-6a26-4779-9164-b893cd05d5e7"],
	"chest": ["61b3abc1-bb87-413b-b933-827bc6d58e0f,45f053e9-67ed-48f2-bcf6-c03b86f1e261"],
	"arms": ["61b3abc1-bb87-413b-b933-827bc6d58e0f,45f053e9-67ed-48f2-bcf6-c03b86f1e261"],
	"cardio": ["e9d35ffa-e7ff-4ba5-8f27-b4a12df95012", "f77a2aee-dd9e-4cca-ac42-a475012e85cc"],
	"test": ["e9d35ffa-e7ff-4ba5-8f27-b4a12df95012"]
}

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
	var finish = (query, date) => {
		Routine.find(query, (err, routines) => {
			if (err) {
				cb([])
			} else {
				if (date) {
					done = routines.length
					removed = 0
					for (i = 0; i < routines.length; i++) {
						not_crowded = function(loc, id, cb) {
							corec.get_usage("locations", loc, (data) => {
								capactity = data.Capacity
								corec.get_usage("weeklytrends", loc, (data) => {
									time = new Date(date)
									data.forEach((item) => {
										if (time.getDay() == item.DayOfWeek && time.getHours() == item.Hour) {
											cb(id, item.Headcount > capactity * 0.6)
											return
										}
									})
								})
							})
						}
						not_crowded(tag_to_loc[routines[i].tags[0]], i, (id, crowded) => {
							if (crowded) {
								removed = 1
								routines.splice(id, 1)
							}
							done--
							if (done <= 0) {
								cb(routines)
							}
						})
					}
				} else {
					cb(routines)
				}
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
				date = null
				if (filters['date']) {
					date = Date.parse(filters['date'])
				}
				finish(query, date)
			});
		}
	}
	if (!waiting) { finish(query, null) }
	
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