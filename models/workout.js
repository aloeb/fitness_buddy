var mongoose = require('mongoose');

var WorkoutSchema = new mongoose.Schema({
  completed_on: { type: Date },
  routine: { type: mongoose.Schema.Types.ObjectId, ref: 'Routine' }
});

module.exports = mongoose.model('Workout', WorkoutSchema);