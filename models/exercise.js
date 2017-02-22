var mongoose = require('mongoose');

var ExerciseSchema = new mongoose.Schema({
  name: String,
  description: String,
  completed: Boolean,
  gym_area: String,
  type: String
});

module.exports = mongoose.model('Exercise', ExerciseSchema);