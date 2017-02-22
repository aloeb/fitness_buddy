var mongoose = require('mongoose');

var ExerciseSchema = new mongoose.Schema({
  name: String,
  description: String,
  gym_area: String,
  type: String,
  popularity: Number
});

module.exports = mongoose.model('Exercise', ExerciseSchema);