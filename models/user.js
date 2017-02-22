var mongoose = require('mongoose');
var SALT_WORK_FACTOR = 10;

var UserSchema = new mongoose.Schema({
    fb_id: String,
    name: String,
    calendar: { type: mongoose.Schema.Types.ObjectId, ref: 'Calendar' },
    workouts: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Workout'} ]
});

UserSchema.pre('save', function(next) {
    next()
    // Check authentication or something? call next when ready
});

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', UserSchema);
