var mongoose = require('mongoose');

// define the schema for our post model
var tagSchema = mongoose.Schema({
    name: String,
    ideas: Number,
    listeners: Number
});


tagSchema.plugin(require('mongoose-paginate'));

module.exports = mongoose.model('Tag', tagSchema);