// app/models/post.js
// load the things we need
var mongoose = require('mongoose');
// define the schema for our post model
var noticeSchema = mongoose.Schema({
	type: String,
	num: Number,
	readed: Boolean,
	recieverId: Number,
	href: String,
	author: {
		id: Number,
		name: String
	},
	addtime: {
		date: String,
		time: String
	}
});


noticeSchema.plugin(require('mongoose-paginate'));

module.exports = mongoose.model('NoticeSchema', noticeSchema);