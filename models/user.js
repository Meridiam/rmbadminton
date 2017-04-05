var mongoose = require('mongoose');

module.exports = mongoose.model('User', {
    username: String,
    password: String,
    email: String,
    firstname: String,
    lastname: String,
    lowerLast: String,
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    dateAdded: { type: Date, required: true, default: Date.now },
    admin: { type: Boolean, required: true, default: false }
});