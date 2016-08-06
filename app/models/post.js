// app/models/post.js
// load the things we need
var mongoose = require('mongoose');
// define the schema for our post model
var postSchema = mongoose.Schema({
    access: Boolean,
    readed: Boolean,
    inTrash: Boolean,
    title: String,
    num: Number,
    tags: [String],
    text: String,
    author: {
        idNum: Number
    },
    addtime: String,
    comments: [],
    reviews: Number
});


postSchema.plugin(require('mongoose-paginate'));
postSchema.plugin(require('mongoosastic'));
module.exports = mongoose.model('Post', postSchema);