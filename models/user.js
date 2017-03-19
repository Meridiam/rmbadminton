var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
    username: String,
    password: String,
    email: String,
    firstname: String,
    lastname: String,
    dateAdded: {type: Date, required: true, default: Date.now}
});