var mongoose = require('mongoose');

var CalendarSchema = new mongoose.Schema({
    // Account id
    accountId: { type: String, required: true },

    // Access token
    accessToken: { type: String, required: true },

    // Source (always Google probably)
    source: String,

    // Optional Refresh Token
    refreshToken: String,

    // Optional expiry time of token
    expiry: Number
});

module.exports = mongoose.model('Calendar', CalendarSchema);