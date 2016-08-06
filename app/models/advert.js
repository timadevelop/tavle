// app/models/post.js
// load the things we need
var mongoose = require('mongoose');

// define the schema for our post model
var advertSchema = mongoose.Schema({
	type: String,
	title: String,
	align: String,
	id: Number,
	imglink: String,
	url: String,
	author: String,
	clicks: Number,
	showed: Number,
	dateDelete: String,
	addtime: String
});
module.exports = mongoose.model('Advert', advertSchema);