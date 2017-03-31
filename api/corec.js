var https = require('https')

var mongoose = require('mongoose');
var User = require('../models/user');
var Workout = require('../models/workout');
var Exercise = require('../models/exercise');
var History = require('../models/history');
var List = require('collections/list');

//connect to mongolab
mongoose.connect('mongodb://adamh:blue@ds119380.mlab.com:19380/fitnessbuddy');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    // we're connected!
})


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
	User.find({ 'fb_id': user_id })
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

corec.get_reccomended_time = function(location, week, cb) {
	var hists;
    //array of time recommendations to return in ascending order
	cb = [];
	var list = new List([]);


    History.find({'LocationID':location}, (err, hist) => {
        if (err) {
            cb(false)
            return
        }

        hists(hist)
    });

    //load corec data into week chart
	var chart = new Array(7);
	chart[0] = new array(24);
    chart[1] = new array(24);
    chart[2] = new array(24);
    chart[3] = new array(24);
    chart[4] = new array(24);
    chart[5] = new array(24);
    chart[6] = new array(24);


    for ( var i =0,len = hists.length; i < len; i++) {
        var day = hists[i].DayOfWeek;
        var hour = hists[i].Hour;
        var headcount = hists[i].HeadCount;
        chart[day][hour] = headcount;


        //use lists for reccs
		if(week[day][hour] == true) {
            list.add(hists[i]);
        }
    }

    //sort hours by ascending headcount
    list.sort(function(a,b){return a.HeadCount - b.HeadCount});

    //maybe add .tojson
	//return first 5 hours with lowest headcounts
    cb.push(list.shift());
    cb.push(list.shift());
    cb.push(list.shift());
    cb.push(list.shift());
    cb.push(list.shift());


		/*


    	//check if new date should be recommended as of right now
    	if(cb[0] == null){
            insert(hists[i], 0);
		}

    	switch(true) {
    		case headcount< cb[0].headcount: insert(hists[i], 0);
            case headcount< cb[1].headcount: insert(hists[i], 1);
            case headcount< cb[2].headcount: insert(hists[i], 2);
            case headcount< cb[3].headcount: insert(hists[i], 3);
            case headcount< cb[4].headcount: insert(hists[i], 4);

		}
	}

	//find 5 least populated times given availability

	for(var day =0; day <7; day++){
    	for(var hour = 0; hour < 24; hour++){
    		if(week[day][hour] == true){
				if(chart[day][hour] < )
			}
		}
	}
	*/

}

corec.get_location_usage = function(location, cb) {

History.find({'LocationID':location}, (err, hist) => {
    if (err) {
        cb(false)
        return
	}

	cb(hist)
	});
}

corec.get_reccomended_exercises = function(user, type, cb) {
	exercise.find({ 'type':type, 'creator.type':'58c1a59c40b5e37c08782f3e'}, (err, exercises) => {
    if (err) {
        cb(false)
        return
    }

	cb(exercises.sort(function(a,b) {return b.popularity - a.popularity}))

	});

}

corec.get_reccomended_workouts = function(user, type, cb) {
    Workout.find({ 'creator.type':'58c1a59c40b5e37c08782f3e'}, (err, workouts) => {
        if (err) {
            cb(false)
            return
        }

        cb(workouts.sort(function(a,b) {b.popularity - a.popularity}))

});

}
module.exports = corec