var mongoose = require('mongoose');

var RoutineSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exercises: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise'} ],
  tags: [ String ],
  name: String
});

module.exports = mongoose.model('Routine', RoutineSchema);