var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    firstname: String,
    lastname: String,
    dateAdded: {type: Date, default: Date.now}
});

module.exports = mongoose.model('User', userSchema);