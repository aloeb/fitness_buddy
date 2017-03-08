var mongoose = require('mongoose');

var HistorySchema = new mongoose.Schema({
    LocationID: String,
    LocationName: String,
    HeadCount: Number,
    EntryDate: { type: Date },
    DayOfWeek: Number,
    DayName: String
});

module.exports = mongoose.model('History', HistorySchema);