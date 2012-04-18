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
  , _ = require('nimble')

var app = module.exports = express.createServer();
var userNames = [];
// DATABASE - DB01
mongoose.connect('mongodb://nodejitsu:b98d23868c52a099003c1546fa4bee90@staff.mongohq.com:10021/nodejitsudb94950299470');
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId
  , Model = mongoose.Model;

var UserSchema = new Schema({
  username: String,
  password: String,
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0},
  email: String,
  activeGames: { type: [GameSchema], default: []},
  history: { type: [GameSchema], default: []},
  sdate: { type: Date, default: Date.now}
});
var GameSchema = new Schema({
  id: Number,
  players: [String], 
  freeTroops: [Number],
  map: {type: String, default: "nyc"},
  turn: {type:Number,default: 0},
  regions: [String],
  gameStarted: {type: Number, default:0}
});
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
  app.use(express.cookieParser("secret"));
  app.use(express.methodOverride());
  app.use(express.session({ secret: "lsjdf3emo23j42m3romf2omoi3r0" }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.set("view options", { layout : false } );
});
// app.dynamicHelpers({
// request: function(req){
// return req;
// },

// session: function(req, res){
//     return req.session;
// }
// });
// Define Development-Specific Environment
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
// Define Production-Specific Environment
app.configure('production', function(){
  app.use(express.errorHandler()); 
});
app.get('/', function (req,res){
    if(req.session.username == null) 
        return res.render('index');
    User.findOne({username:req.session.username}, function (err, user){
        return res.render('home', { activeGames: user.activeGames});
    });
});
app.get('/home', function (req,res){
    if(req.session.username == null)
        return res.redirect('/login');
    User.findOne({username:req.session.username}, function (err, user){
        return res.render('home', { activeGames: user.activeGames});
    });
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
        if(count == 0 && req.body.user.name.length != 0){
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
                res.redirect('/home');
            } else{
                // If there is no match, return them to the login page, with the error box showing
                res.render('login', { error : true});
            }
        });
    }
});
app.get('/logout', function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    req.session.username = null;
    return res.redirect('/login');
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
        var su = req.session.username;
        return res.render('newgame', {error: "Do you not have any friends? C'mon, play with somebody.", users: __.reject(userNames, function(ur){ return ur == su})});
    }
    if(!(__.isArray(req.body.game.users))){
        req.body.game.users = [req.body.game.users];
    }
    console.log(req.body.game.users.length);
    if(req.body.game.users.length > 3){
        var su = req.session.username;
        return res.render('newgame', {error: "Woah there! You have too many friends, you can only play with three.", users: __.reject(userNames, function(ur){ return ur == su})});   
    }
    var pl = [req.session.username];
    pl = pl.concat(req.body.game.users);
    var tUsers = [];
    var numPlayers = pl.length;
    var freeT = [];
    var mapName = req.body.game.map;
    var tRegions = [];
    var sRegions = [];
    for(var ii = 0; ii < numPlayers; ii++){
        freeT.push(50);
    }
    if(mapName == "nyc"){
        for(var l = 0; l < 15; l++){
            if(numPlayers == 2){
                tRegions[l] = {};
                tRegions[l].player = l % 2; 
                tRegions[l].troops = 1;
                sRegions[l] = JSON.stringify(tRegions[l]);
                freeT[l%2]--;
            } else if (numPlayers == 3){
                tRegions[l] = {};
                tRegions[l].player = l % 3;
                tRegions[l].troops = 1;
                sRegions[l] = JSON.stringify(tRegions[l]);
                freeT[l%3]--;
            } else if (numPlayers == 4){
                tRegions[l] = {};
                tRegions[l].player = l % 4;
                tRegions[l].troops = 1;
                sRegions[l] = JSON.stringify(tRegions[l]);
                freeT[l%4]--;
            } else {
                return res.render('error');
            }
        }
    } else {
        console.log("oh damn")
        return res.render("/games/23923423")
    }
    var genID = function(){
        console.log('--users--');
        console.log(tUsers);
        console.log('----');
        var rand = Math.floor(Math.random()*1000000000);
        Game.count({id: rand}, function (err, count){
            if(count == 1){
                genID();
            } else {
                console.log("pl");
                console.log(pl);
                console.log("id")
                console.log(rand);
                var g = new Game({id: rand, players: pl, freeTroops: freeT, regions: sRegions });
                g.save(function (err, gameSaved){
                    if(err){
                        console.log("game did not save");
                        console.log(err)
                        return res.render('error');
                    } else {
                        __.each(pl, function(uzn){
                            User.findOne({username:uzn},function(err, unc){
                                unc.activeGames.push(g);
                                unc.save();
                            });
                        });
                        // console.log(rand);
                        // console.log(sRegions);
                        console.log("game saved!");
                        return res.redirect('/games/'+rand);
                    }
                });
            }
        });
    }
    genID();
});
// PLAY GAME - G02
app.get('/games',function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    return res.redirect('/home');
});
app.get('/games/:id',function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    if(req.params.id == "past"){
        return res.redirect('/home');
    }
    Game.findOne({id:req.params.id}, function (err, ga){ 
        if(err){ return res.render('error');}
        console.log(ga.regions);
        console.log(ga);
        var ind = 0;
        for(var i = 0; i < ga.players.length; i++){
            if(ga.players[i] == req.session.username){
                ind = i;
                break;
            }
        }
        console.log(ind);
        console.log(ga.players);
        return res.render('map', {game: ga, pNum:ind });
    });

});
app.get('/nyan', function (req, res){
    return res.render('error');
});
app.get('/mu-0e36082c-12fbbfb6-41f76021-6ee9b732', function (req,res){
    return '42'
});
// app.error(function (err, req, res){
//     res.render('error')
// });
// FUNCTIONS - F00

app.listen(5000);