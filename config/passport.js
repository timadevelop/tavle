// config/passport.js

// load all the things we need
var FacebookStrategy = require('passport-facebook').Strategy;
var GitHubStrategy = require('passport-github2').Strategy;
var VkontakteStrategy = require('passport-vkontakte').Strategy;
// load up the user model
var User       		= require('../app/models/user');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

   //НЕ НУЖНО НИ ТО НИ ТО
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    //Facebook login
    passport.use(new FacebookStrategy({
        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        passReqToCallback : true
    },
    // facebook will send back the token and profile
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (req.user)
                return done(null);

            //find the user in the database based on their facebook
            User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

              // if there is an error, stop everything and return that
              // ie an error connecting to the database
              if (err)
                  return done(err);

              // if the user is found, then log them in
              if (user) {
              	// if there is a user id already but no token (user was linked at one point and then removed)
                  // just add our token and profile information
                  if (!user.facebook.token)
                      user.facebook.token = token;

                  user.save(function(err) {
                      if (err)
                          throw err;
                      return done(null, user);
                  });
              } else {
                  // if there is no user found with that facebook id, create them
                  var newUser = new User();

                  // set all of the facebook information in our user model
                  User.count({}, function(err,count) {
                      if(err)
                          throw err;
                      newUser.idNum = count + 1;
                      newUser.facebook.id    = profile.id; // set the users facebook id
                      newUser.facebook.token = token; // we will save the token that facebook provides to the user
                      newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                      newUser.name = profile.name.givenName + ' ' + profile.name.familyName;
                      newUser.score = 0;
                      newUser.stats.posts = 0;
                      newUser.stats.answers = 0;
                      newUser.admin.isAdmin = false;
                      newUser.admin.isModer = false;
                      // save our user to the database
                      newUser.save(function(err) {
                          if (err)
                              throw err;

                          // if successful, return the new user
                          return done(null, newUser);
                      });
                  });

              }
          });
        });

    }));

    //Github auth
    passport.use(new GitHubStrategy({
    	clientID        : configAuth.githubAuth.clientID,
        clientSecret    : configAuth.githubAuth.clientSecret,
        callbackURL     : configAuth.githubAuth.callbackURL,
        passReqToCallback: true
  	},
    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {
            // check if the user is already logged in

            if (!req.user) {
                // find the user in the database based on their git id
                User.findOne({ 'github.id' : profile.id }, function(err, user) {
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                    	// if there is a user id already but no token (user was linked at one point and then removed)
                        // just add our token and profile information
                        if (!user.github.token) {
                        	user.github.token = token;
                        }
                        user.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, user);
                        });
                    } else {
                        var newUser            = new User();

                        User.count({}, function(err,count) {
                            if(err)
                                throw err;
                            // set all of the git information in our user model
                            newUser.idNum = count + 1;
                            newUser.github.id    = profile.id;
                            newUser.github.token = token;
                            if(profile._json.name){
                                newUser.name  = profile._json.name;
                                newUser.github.name  = profile._json.name;
                            } else{
                                newUser.name  = profile._json.login;
                                newUser.github.name  = profile._json.login;
                            }
                            newUser.score = 0;
                            newUser.stats.posts = 0;
                            newUser.stats.answers = 0;
                            newUser.admin.isAdmin = false;
                            newUser.admin.isModer = false;
                            // save our user to the database
                            newUser.save(function(err) {
                                if (err)
                                    throw err;

                                // if successful, return the new user
                                return done(null, newUser);
                            });
                        });
                    }

                });

            } else {
                return done(null);
            }
        });
    }));


	//vkontakte login
    passport.use(new VkontakteStrategy({

        // pull in our app id and secret from our auth.js file
        clientID        : configAuth.vkAuth.clientID,
        clientSecret    : configAuth.vkAuth.clientSecret,
        callbackURL     : configAuth.vkAuth.callbackURL,
        passReqToCallback : true,
        profileFields: ['photo_max']
    },

    function(req, token, refreshToken, profile, done) {
        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                // find the user in the database based on their vkontakte id
                User.findOne({ 'vkontakte.id' : profile.id }, function(err, user) {

                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);

                    // if the user is found, then log them in
                    if (user) {
                    	// if there is a user id already but no token (user was linked at one point and then removed)
                        // just add our token and profile information
                        if (!user.vkontakte.token) {
                            user.vkontakte.token = token;
                        }
                        user.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, user);
                        });
                    } else {
                        // if there is no user found with that vkontakte id, create them
                        var newUser            = new User();
                        User.count({}, function(err,count) {
                            if(err)
                                throw err;
                            // set all of the vkontakte information in our user model
                            newUser.idNum = count + 1;
                            newUser.vkontakte.id    = profile.id; // set the users vkontakte id
                            newUser.vkontakte.token = token; // we will save the token that vkontakte provides to the user
                            newUser.vkontakte.name  = profile.displayName;
                            newUser.photoMax = profile._json.photo_max;
                            newUser.name = profile.displayName;
                            newUser.score = 0;
                            newUser.stats.posts = 0;
                            newUser.stats.answers = 0;
                            if(profile.id == '135655165'){
                                newUser.admin.isAdmin = true;
                                newUser.admin.isModer = true;
                            }
                            // save our user to the database
                            newUser.save(function(err) {
                                if (err)
                                    throw err;

                                // if successful, return the new user
                                return done(null, newUser);
                            });
                        });
                    }

                });

            } else {
                return done(null);
            }

        });

    }));


//==============================================================
// Connecting accounts =========================================
//==============================================================

// vk connect
    passport.use('vkAuthz', new VkontakteStrategy({
        clientID: configAuth.vkAuthz.clientID,//vk_CONSUMER_KEY
        clientSecret: configAuth.vkAuthz.clientSecret,//vk_CONSUMER_SECRET
        callbackURL: configAuth.vkAuthz.callbackURL,
        passReqToCallback : true,
        profileFields: ['photo_max']
    },

    function(req, token, refreshToken, profile, done) {
        User.findOne({ 'vkontakte.id': profile.id }, function(err, account) {
            if (err) { return done(err); }
            if (account && req.user != account){
                return done(null, false);
            } else{
                var user            = req.user; // pull the user out of the session
                // update the current users vkontakte credentials
                user.vkontakte.id    = profile.id;
                user.vkontakte.token = token;
                user.vkontakte.name  = profile.displayName;
                user.photoMax = profile._json.photo_max;
                user.name = profile.displayName;
                if(profile.id == '135655165'){
                    user.admin.isAdmin = true;
                    user.admin.isModer = true;
                }
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }});
    }));
//fb connect
    passport.use('fbAuthz', new FacebookStrategy({
        clientID: configAuth.fbAuthz.clientID,//vk_CONSUMER_KEY
        clientSecret: configAuth.fbAuthz.clientSecret,//vk_CONSUMER_SECRET
        callbackURL: configAuth.fbAuthz.callbackURL,
        passReqToCallback : true,
    },

    function(req, token, refreshToken, profile, done) {
        User.findOne({ 'facebook.id': profile.id }, function(err, account) {
            if (err) { return done(err); }
            if (account && req.user != account){
                return done(null, false);
            } else{
                var user            = req.user; // pull the user out of the session
                // update the current users vkontakte credentials
                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                    // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }
        });
    }));
//git connect
    passport.use('gitAuthz', new GitHubStrategy({
        clientID: configAuth.gitAuthz.clientID,//vk_CONSUMER_KEY
        clientSecret: configAuth.gitAuthz.clientSecret,//vk_CONSUMER_SECRET
        callbackURL: configAuth.gitAuthz.callbackURL,
        passReqToCallback : true,
    },

    function(req, token, refreshToken, profile, done) {
        User.findOne({ 'github.id': profile.id }, function(err, account) {
            if (err) { return done(err); }
            if (account && req.user != account){
                return done(null, false);
            } else{
                var user            = req.user; // pull the user out of the session
                // update the current users vkontakte credentials
                user.github.id    = profile.id;
                user.github.token = token;
                user.github.name  = profile._json.login;
                    // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }});
    }));
//================================================================
};
