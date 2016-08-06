// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    facebook         : {
        id           : String,
        token        : String,
        name         : String,
    },
    github           : {
        id           : String,
        token        : String,
        name         : String
    },
    vkontakte        : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    access: {type:Boolean, default: true},
    photoMax: String,
    name: String,
    score: Number,
    stats:{
        posts: Number,
        answers: Number
    },
    about: String,
    contacts: String,
    idNum: Number,
    admin: {
        isAdmin: Boolean,
        isModer: Boolean,
        msgs: []
    },
    messages: [],
    tags: []
});

userSchema.plugin(require('mongoose-paginate'));

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
