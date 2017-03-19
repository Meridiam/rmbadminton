var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var membershipSchema = new Schema({
    provider:  String,
    providerUserId:  String,
    accessToken: String,
    displayname: String,
    email: String,
    firstname: String,
    lastname: String,
    dateAdded: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Membership', membershipSchema);