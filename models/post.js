var mongoose = require('mongoose');

var postSchema = new mongoose.Schema({
    title: String,
    body: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //readableDate: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);