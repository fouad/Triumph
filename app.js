
/**
 * Module dependencies.
 */

var express = require('express') // imports express
  , routes = require('./routes') // imports routes
  , mongoose = require('mongoose') // imports mongoose
  , crypto =  require('crypto') // imports crypto

var app = module.exports = express.createServer();

// Database Setup

mongoose.connect('mongodb://nodejitsu:843901effad4cb5190a2d14ac9e5647e@staff.mongohq.com:10069/nodejitsudb384019315904');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Model = mongoose.Model;

var UserSchema = new Schema({
  username: String,
  password: String,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0},
  email: String,
  sdate: { type: Date, default: Date.now}
});

var User = mongoose.model('User', UserSchema);
// Check to make sure MongoDB is conencted
// Display number of records currently in the database
mongoose.connection.on("open", function(){
  console.log("Mongoose connected");
  User.count({}, function( err, count){
    console.log( "Records:", count );
  });
  User.find({}, function(err, users){
  	console.log( "Users:", users);
  });
});

// Express Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.set("view options", { layout : false } );
});
// Define Development-Specific Environment
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
// Define Production-Specific Environment
app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', routes.index);
app.get('/index', routes.index);
// Handle Login Routing
app.get('/login', function (req, res) {
	// Check if user logged in, by checking req.cookies.username
	if(req.cookies.username != null)
		// If they are, redirect them to the home page
		res.redirect('/home');
	else
		res.render('login', { error : false});
});
app.post('/login', function (req, res){
	var n = req.cookies.username;
	console.log("username = "+ n);
	// Check if user logged in, by checking req.cookies.username
	if(req.cookies.username != null)
		// If they are, redirect them to the home page
		res.redirect('/home');
	// For debugging purposes, log to console progress in the fucntion
	console.log('login');
	console.log(req.body.user.name);
	// Generate a secure password using md5, from the plain text passed from the login form
	var pass = crypto.createHash('md5').update(req.body.user.pass).digest("hex");
	console.log(pass);
	// Check if there are any users with the same username and pass, effectively authenticating the user
	User.count({username : req.body.user.name, password: pass}, function(err, count){
		console.log(count);
		if(count == 1){
			// If there is a match, create a cookie to keep the user logged in
			res.cookie('username', req.body.user.name, { expires: new Date(Date.now() + 90000000), httpOnly: true});
			res.redirect('/home');
		}
		else{
			// If there is no match, return them to the login page, with the error box showing
			res.render('login', { error : true});
		}
	});
});
app.get('/signup', function(req, res){
	res.render('signup', { taken: false});
});
app.post('/signup', function (req, res) {
	console.log('signup');
	// Generate a secure password using md5, from the plain text passed from the signup form
	var pass = crypto.createHash('md5').update(req.body.user.pass).digest("hex");
	// Again for debugging purposes, just to make sure that the function isn't creating two objects with the same username
	console.log(pass);
	console.log(User.count({username : req.body.user.name}, function(err, count){
		return count;
	}));
	// Make sure no other documents in the database have the same username
	User.count({username : req.body.user.name}, function(err, count){
		console.log(count);
		if(count == 0){
			// If there are no others, then create the user with the username && md5(password)
			var user = new User({username: req.body.user.name, password: pass, email: req.body.user.email });
			user.save(function(err, user_Saved){
			    if(err){
			    	// In case the database disconnects, or fails silently - throw an error
			        throw err;
			        console.log(err);
			    }else{
			    	// For Debugging purposes, let debugger know it succesfully saved
			        console.log('saved!');
			    }
			});
			// Create a cookie to keep the user logged in
			res.cookie('username', req.body.user.name, { expires: new Date(Date.now() + 90000000), httpOnly: true});
			// Redirect to the home page
			res.redirect('/home');
		}
		else{
			//If there is already a user with that username in the system, render the signup page again and enable the taken div
			res.render('signup', { taken : true});
		}
	});
});
app.get('/home', function (req, res){
	if(req.cookies.username == null)
		res.redirect('/login');
	// Render the home page which has all of the menu items
	res.render('home');
});
app.get('/logout', function (req, res){
	// Logs the user out by clearing their cookie and redirecting them to the login page
	if(req.cookies.username == null)
		res.redirect('/login');
	else{
		res.clearCookie('username');
		res.redirect('/login');
	}
});
app.get('/users', function (req, res) {
	// Send anyone who isn't logged in, straight to the login page
	// Redirection from login page should be implemented later
	// just use ?to=/users/id/whatever
	if(req.cookies.username == null)
		res.redirect('/login');
	User.find({}, function(err, users){
  		res.render('users', { users: users});
  	});
});

// Starts the server
app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
