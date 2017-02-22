var mongoose = require('mongoose');

var WorkoutSchema = new mongoose.Schema({
  completed_on: { type: Date },
  exercises: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise'} ]
});

module.exports = mongoose.model('Workout', WorkoutSchema);