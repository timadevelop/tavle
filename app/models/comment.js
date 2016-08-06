// app/models/post.js
// load the things we need
var mongoose = require('mongoose');
// define the schema for our post model
var commentSchema = mongoose.Schema({
    text: String,
    authorId: String,
    authorName: String,
    authorImg: String,
    postNum: Number,
    num: Number,
    rating: [],
    addtime: String,
    htime: String,
    to: Number,
    appeals:[],
    haveAppeals: Boolean
});


commentSchema.plugin(require('mongoose-paginate'));

module.exports = mongoose.model('Comment', commentSchema);