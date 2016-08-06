// server.js
// pagination change rus in the module
var express = require('express');
var app = express();
var http = require('http').Server(app);
var port  = 3000;
var mongoose = require('mongoose');
var passport = require('passport');
var bodyParser = require('body-parser');
var paginate = require('express-paginate');
var flash = require('connect-flash');
require('./config/passport')(passport); // pass passport for configuration
var configDB = require('./config/database.js');
var db = mongoose.connect(configDB.url, {'auth':'yes'}); // connect to our database

app.configure(function() {
	app.use(express.static(__dirname + '/views/public'));
	//set up must be and max count of elements in one page
	app.use(paginate.middleware(20, 40));
	app.disable('x-powered-by');
	// set up our express application
	//app.use(express.logger('dev')); // log every request to the console
	app.use(express.cookieParser()); // read cookies (needed for auth)
	app.use(bodyParser.urlencoded({ extended: true})); // get information from html forms

	app.set('view engine', 'jade'); // set up ejs for templating

	// required for passport
	app.use(express.session({
		secret: 'tavlelearnnodejstima',
		cookie: { maxAge: 9676800000 }
	})); //9676800000ms session secret + 16 weeks.( 4 month )
	app.use(passport.initialize());
	app.use(passport.session()); // persistent login sessions
	app.use(flash()); // use connect-flash for flash messages stored in session
});
// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/socket.js')(http); //load socket.io logic

app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', {
    	page: 'Ошибка'
    });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }
  res.type('txt').send('Not found');
});
app.use(function(err, req, res, next){
	console.log(err);
	res.status(err.status || 500);
	res.render('500', { error: err });
});
// launch ======================================================================
http.listen(port, function () {
	console.log('The magic happens on port ' + port + ' ^.^ Котик на удачу');
});
