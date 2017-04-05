var mongoose = require('mongoose');

var eventSchema = new mongoose.Schema({
    name: String,
    desc: String,
    date: String,
    happens: { type: Date, default: Date.now },
    duration: Number,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);