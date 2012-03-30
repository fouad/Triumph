var express = require('express') // imports express
  , routes = require('./routes') // imports routes
  , mongoose = require('mongoose') // imports mongoose
  , crypto =  require('crypto') // imports crypto

var app = module.exports = express.createServer();

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
  map: {type: String, default: "nyc"},
  turn: {type:Number,default: 0},
  data: String
});

var User = mongoose.model('User', UserSchema);
var Game = mongoose.model('Game', GameSchema);
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
app.get('/games', function (req,res){
    return res.redirect('/home');
})
app.get('/games/new', function (req, res){
    if(req.session.username == null)
        return res.redirect('/login');
    res.render('newgame', {error: false});
});
app.post('/games/new', function (req,res){
    if(req.session.username == null)
        return res.redirect('/login');
    // if(req.body.form.)
});
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
app.get('*', function (req, res){
    res.render('error')
});
app.error(function (err, req, res, next){
    res.render('error')
});
// parses NYC game
var parseMD = function (s) {
  var array = s.split(" ")
  var map = {}
  map.map = array[0]
  if (map.map == "nyc"){
    var phase = 0;
    var tempjson = {};
    for (var i = 1; i < array.length; i++) {
        if (phase == 0) {
          tempjson.player = array[i];
          phase++;
        } else if( phase == 1) {
          tempjson.troops = array[i];
          map.regions[i - 1 - phase] = tempjson;
          phase = 0;
        }
    }
  } else {
    console.log('unrecognized map format')
  }
  return map
}
app.listen(5000);