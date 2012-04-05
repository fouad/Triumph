// Triumph - Risk-esque game in node.js
// Authors: Fouad Matin (Lead), Samer Masterson, Max Knutsen
// Copyright © 2012 Fouad Matin
// TABLE OF CONTENTS
// -----------------
// Database - DB01
// Config - C01
// Home - H01
// ------- USER MANAGEMENT - U00
// Signup - U01
// Login - U02
// ------- GAMES - G00
// New Game - G01
// Play Game - G02
// 
// FUNCTIONS - F00
// ---------------

var express = require('express') // imports express
  , routes = require('./routes') // imports routes
  , mongoose = require('mongoose') // imports mongoose
  , crypto =  require('crypto') // imports crypto
  , __ = require('underscore')

var app = module.exports = express.createServer();
var userNames = [];
// DATABASE - DB01
mongoose.connect('mongodb://nodejitsu:fc36b5d4676f00975398579786e6f768@flame.mongohq.com:27102/nodejitsudb996748635348');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Model = mongoose.Model;

var UserSchema = new Schema({
  username: String,
  password: String,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0},
  email: String,
  activeGames: [GameSchema],
  history: [GameSchema],
  sdate: { type: Date, default: Date.now}
});
var GameSchema = new Schema({
  id: Number,
  players: {type: [UserSchema]}, 
  freeTroops: [Number],
  map: {type: String, default: "nyc"},
  turn: {type:Number,default: 0},
  data: String
});
// Default Map Data
var blankMaps = {};
blankMaps["nyc"] = {
    name: "nyc",
    regions: [{strat: 0}]
}
var User = mongoose.model('User', UserSchema);
var Game = mongoose.model('Game', GameSchema);
// Check to make sure MongoDB is connected
// Display number of records currently in the database
mongoose.connection.on("open", function(){
  console.log("Mongoose connected");
  User.count({}, function( err, count){
    console.log( "Records:", count );
  });
  User.find({}, function(err, users){
    console.log( "Users:", users);
    __.each(users, function(user){
      userNames.push(user.username);
    });
  });
});
// CONFIG - C01
// Express Configuration
var notNames = ["null"]
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: "lsjdf3emo23j42m3romf2omoi3r0" }));
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
app.get('/', function (req,res){
  res.render('index');
});
app.get('/home', function (req,res){
    if(req.session.username == null)
        return res.redirect('/login');
    res.render('home')
});
// USER MANAGEMENT - U00
// SIGNUP - S01

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
            userNames.push(req.body.user.name);
            req.session.username =req.body.user.name;
            // Create a cookie to keep the user logged in
            // re.session('username', req.body.user.name, { expires: new Date(Date.now() + 90000000), httpOnly: true});
            // Redirect to the home page
            res.redirect('/home');
        }
        else{
            //If there is already a user with that username in the system, render the signup page again and enable the taken div
            res.render('signup', { taken : true});
        }
    });
});
// LOGIN - U02
app.get('/login', function (req, res) {
    // Check if user logged in, by checking req.session.username
    if(req.session.username != null)
        // If they are, redirect them to the home page
        res.redirect('/home');
    else
        res.render('login', { error : false});
});
app.post('/login', function (req, res){
    var n = req.session.username;
    console.log("username = "+ n);
    // Check if user logged in, by checking req.session.username
    if(req.session.username != null)
        // If they are, redirect them to the home page
        return res.redirect('/home');
    else{ 
        // For debugging purposes, log to console progress in the fucntion
        console.log('------');
        console.log('login');
        console.log('------');
        console.log(req.body.user.name);
        // Generate a secure password using md5, from the plain text passed from the login form
        var pass = crypto.createHash('md5').update(req.body.user.pass).digest("hex");
        console.log(pass);
        // Check if there are any users with the same username and pass, effectively authenticating the user
        User.count({username : req.body.user.name, password: pass}, function(err, count){
            if(count == 1){
                // If there is a match, create a cookie to keep the user logged in
                // res.session('username', req.body.user.name, { expires: new Date(Date.now() + 90000000), httpOnly: true});
                req.session.username =req.body.user.name;                
                res.render('home');

            }
            else{
                // If there is no match, return them to the login page, with the error box showing
                res.render('login', { error : true});
            }
        });
    }
});
// GAMES - G00
app.get('/games', function (req,res){
    return res.redirect('/home');
});
// NEW GAME - G01
app.get('/games/new', function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    var su = req.session.username;
    res.render('newgame', {error: false, users: __.reject(userNames, function(ur){ return ur == su})});
});
app.post('/games/new', function (req,res){
    if(req.session.username == null)
        return res.redirect('/login');
    if(typeof req.body.game.users == 'undefined'){
        return res.render('newgame', {error: "Do you not have any friends? C'mon, play with somebody.", users: userNames});
    }
    if(req.body.game.users.length > 3){
        return res.render('newgame', {error: "Woah there! You have too many friends, you can only play with three.", users: userNames});   
    }
    var pl = [req.session.username];
    pl = pl.concat(req.body.game.users);
    var us = _.map(pl, function(un){
        User.findOne({username:un}, function(err, user){
            return user;
        });
    });
    var numPlayers = pl.length;
    var freeT = [];
    var mapName = req.body.game.map;
    var tRegions = [];
    for(var ii = 0; i < numPlayers; i++){
        freeT.push(50);
    }
    if(mapName == "nyc"){
        for(var l = 0; l < 17; l++){

        }
    } else {
        console.log("oh damn")
        return res.render("/games/23923423")
    }
    var g = new Game({id: 3, players: us, });




    console.log("users: ",req.body.game.users)
    console.log("map: ",req.body.game.map)
    res.redirect('/login')
});
// PLAY GAME - G02
app.get('/games/:id',function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    Game.count({id: req.params.id}, function (err, count){
        if(count == 1){
            res.render('map', Game.find({id:req.params.id}))
        }
        else{
            res.render('error');
        }
    });

});
app.error(function (err, req, res){
    res.render('error')
});
// FUNCTIONS - F00

app.listen(5000);