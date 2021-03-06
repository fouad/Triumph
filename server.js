
/* 
Triumph
Realtime Risk-esque Multiplayer Game using Express, Redis, Mongo, jQuery
Author: Fouad Matin (@heyfouad) - github: matin
*/

(function() {
  var Game, GameSchema, Model, ObjectId, RedisStore, Schema, User, UserSchema, app, crypto, express, mongoose, notNames, redisConfig, userNames, __;

  express = require("express");

  mongoose = require("mongoose");

  crypto = require("crypto");

  __ = require("underscore");

  RedisStore = require('connect-redis')(express);

  app = module.exports = express.createServer();

  redisConfig = {
    host: 'lab.redistogo.com',
    port: 9178,
    pass: 'a0b72f75e8a375619350204056c54ff0',
    db: 'nodejitsu'
  };

  userNames = [];

  mongoose.connect("mongodb://nodejitsu:7d632d485ddb4fbfd696ade7a568d726@flame.mongohq.com:27023/nodejitsudb661488872412");

  Schema = mongoose.Schema;

  ObjectId = Schema.ObjectId;

  Model = mongoose.Model;

  UserSchema = new Schema({
    username: String,
    password: String,
    wins: {
      type: Number,
      "default": 0
    },
    losses: {
      type: Number,
      "default": 0
    },
    email: String,
    activeGames: {
      type: [GameSchema],
      "default": []
    },
    history: {
      type: [GameSchema],
      "default": []
    },
    sdate: {
      type: Date,
      "default": Date.now
    }
  });

  GameSchema = new Schema({
    id: Number,
    players: [String],
    freeTroops: [Number],
    map: {
      type: String,
      "default": "nyc"
    },
    turn: {
      type: Number,
      "default": 0
    },
    regions: [String],
    gameStarted: {
      type: Number,
      "default": 0
    }
  });

  User = mongoose.model("User", UserSchema);

  Game = mongoose.model("Game", GameSchema);

  mongoose.connection.on("open", function() {
    return console.log("Mongoose connected");
  });

  User.find().run(function(err, users) {
    console.log(users);
    return __.map(users, function(eu) {
      console.log(eu.username);
      return userNames.push(eu.username);
    });
  });

  notNames = ["null"];

  app.configure(function() {
    app.set("views", __dirname + "/views");
    app.set("view engine", "ejs");
    app.use(express.bodyParser());
    app.use(express.cookieParser('pineapple'));
    app.use(express.methodOverride());
    app.use(express.session({
      secret: 'joijeorj3904kr3',
      store: new RedisStore(redisConfig)
    }));
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
    return app.set("view options", {
      layout: false
    });
  });

  app.locals.use(function(req, res) {
    res.locals.req = req;
    return res.locals.session = req.session;
  });

  app.configure("development", function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure("production", function() {
    return app.use(express.errorHandler());
  });

  app.get("/", function(req, res) {
    if (req.session.username == null) return res.render("index");
    return User.findOne({
      username: req.session.username
    }, function(err, user) {
      return res.render("home", {
        activeGames: user.activeGames
      });
    });
  });

  app.get("/home", function(req, res) {
    if (req.session.username == null) return res.redirect("/login");
    return User.findOne({
      username: req.session.username
    }, function(err, user) {
      return res.render("home", {
        activeGames: user.activeGames
      });
    });
  });

  app.get("/signup", function(req, res) {
    return res.render("signup", {
      taken: false
    });
  });

  app.post("/signup", function(req, res) {
    var pass;
    console.log("signup");
    pass = crypto.createHash("md5").update(req.body.user.pass).digest("hex");
    console.log(pass);
    console.log(User.count({
      username: req.body.user.name
    }, function(err, count) {
      return count;
    }));
    return User.count({
      username: req.body.user.name
    }, function(err, count) {
      var user;
      console.log(count);
      if (count === 0 && req.body.user.name.length !== 0) {
        user = new User({
          username: req.body.user.name,
          password: pass,
          email: req.body.user.email
        });
        user.save(function(err, user_Saved) {
          if (err) {
            throw errconsole.log(err);
          } else {
            return console.log("saved!");
          }
        });
        userNames.push(req.body.user.name);
        req.session.username = req.body.user.name;
        return res.redirect("/home");
      } else {
        return res.render("signup", {
          taken: true
        });
      }
    });
  });

  app.get("/login", function(req, res) {
    if (req.session.username != null) {
      return res.redirect("/home");
    } else {
      return res.render("login", {
        error: false
      });
    }
  });

  app.post("/login", function(req, res) {
    var n, pass;
    n = req.session.username;
    console.log("username = " + n);
    if (req.session.username == null) {
      console.log("------");
      console.log("login");
      console.log("------");
      console.log(req.body.user.name);
      pass = crypto.createHash("md5").update(req.body.user.pass).digest("hex");
      console.log(pass);
      return User.count({
        username: req.body.user.name,
        password: pass
      }, function(err, count) {
        if (count === 1) {
          req.session.username = req.body.user.name;
          return res.redirect("/home");
        } else {
          return res.render("login", {
            error: true
          });
        }
      });
    }
  });

  app.get("/logout", function(req, res) {
    if (req.session.username == null) return res.redirect("/login");
    req.session.username = null;
    return res.redirect("/login");
  });

  app.get("/games", function(req, res) {
    return res.redirect("/home");
  });

  app.get("/games/new", function(req, res) {
    var su;
    if (req.session.username == null) return res.redirect("/login");
    su = req.session.username;
    console.log(userNames);
    return res.render("newgame", {
      error: false,
      users: __.reject(userNames, function(ur) {
        return ur === su;
      })
    });
  });

  app.post("/games/new", function(req, res) {
    var freeT, genID, ii, l, mapName, numPlayers, pl, sRegions, su, tRegions, tUsers;
    if (req.session.username == null) return res.redirect("/login");
    if (typeof req.body.game.users === "undefined") {
      su = req.session.username;
      return res.render("newgame", {
        error: "Do you not have any friends? C'mon, play with somebody.",
        users: __.reject(userNames, function(ur) {
          return ur === su;
        })
      });
    }
    if (!__.isArray(req.body.game.users)) {
      req.body.game.users = [req.body.game.users];
    }
    console.log(req.body.game.users.length);
    if (req.body.game.users.length > 3) {
      su = req.session.username;
      return res.render("newgame", {
        error: "Woah there! You have too many friends, you can only play with three.",
        users: __.reject(userNames, function(ur) {
          return ur === su;
        })
      });
    }
    pl = [req.session.username];
    pl = pl.concat(req.body.game.users);
    tUsers = [];
    numPlayers = pl.length;
    freeT = [];
    mapName = req.body.game.map;
    tRegions = [];
    sRegions = [];
    ii = 0;
    while (ii < numPlayers) {
      freeT.push(50);
      ii++;
    }
    if (mapName === "nyc") {
      l = 0;
      while (l < 15) {
        if (numPlayers === 2) {
          tRegions[l] = {};
          tRegions[l].player = l % 2;
          tRegions[l].troops = 1;
          sRegions[l] = JSON.stringify(tRegions[l]);
          freeT[l % 2]--;
        } else if (numPlayers === 3) {
          tRegions[l] = {};
          tRegions[l].player = l % 3;
          tRegions[l].troops = 1;
          sRegions[l] = JSON.stringify(tRegions[l]);
          freeT[l % 3]--;
        } else if (numPlayers === 4) {
          tRegions[l] = {};
          tRegions[l].player = l % 4;
          tRegions[l].troops = 1;
          sRegions[l] = JSON.stringify(tRegions[l]);
          freeT[l % 4]--;
        } else {
          return res.render("error");
        }
        l++;
      }
    } else {
      console.log("oh damn");
      return res.render("/games/23923423");
    }
    genID = function() {
      var rand;
      console.log("--users--");
      console.log(tUsers);
      console.log("----");
      rand = Math.floor(Math.random() * 1000000000);
      return Game.count({
        id: rand
      }, function(err, count) {
        var g;
        if (count === 1) {
          return genID();
        } else {
          console.log("pl");
          console.log(pl);
          console.log("id");
          console.log(rand);
          g = new Game({
            id: rand,
            players: pl,
            freeTroops: freeT,
            regions: sRegions
          });
          return g.save(function(err, gameSaved) {
            if (err) {
              console.log("game did not save");
              console.log(err);
              return res.render("error");
            } else {
              __.each(pl, function(uzn) {
                return User.findOne({
                  username: uzn
                }, function(err, unc) {
                  unc.activeGames.push(g);
                  return unc.save();
                });
              });
              console.log("game saved!");
              return res.redirect("/games/" + rand);
            }
          });
        }
      });
    };
    return genID();
  });

  app.get("/games", function(req, res) {
    if (req.session.username == null) return res.redirect("/login");
    return res.redirect("/home");
  });

  app.get("/games/:id", function(req, res) {
    if (req.session.username == null) return res.redirect("/login");
    if (req.params.id === "past") return res.redirect("/home");
    return Game.findOne({
      id: req.params.id
    }, function(err, ga) {
      var i, ind;
      if (err) return res.render("error");
      console.log(ga);
      if (ga === null) return res.render("error");
      ind = 0;
      i = 0;
      User.findOne({
        username: req.session.username
      }, function(err, uf) {
        return console.log(uf);
      });
      while (i < ga.players.length) {
        if (ga.players[i] === req.session.username) {
          ind = i;
          break;
        }
        i++;
      }
      console.log(ind);
      console.log(ga.players);
      return res.render("map", {
        game: ga,
        pNum: ind
      });
    });
  });

  app.get("/nyan", function(req, res) {
    return res.render("error");
  });

  app.get("/about", function(req, res) {
    return res.render("about");
  });

  app.get("/mu-0e36082c-12fbbfb6-41f76021-6ee9b732", function(req, res) {
    return "42";
  });

  app.post("/game/move", function(req, res) {
    console.log('move');
    console.log(req.params);
    console.log(req.body.gameid);
    console.log('whatevs' + req.body.gameid);
    Game.find({
      id: req.body.gameid
    }, function(err, g) {
      console.log('game ++->');
      return console.log(g);
    });
    return Game.findOne({
      id: req.body.gameid
    }, function(err, game) {
      if (err) return -1;
      if (game === null) return -1;
      game.regions = JSON.parse(req.body.regions);
      console.log("ooo regions ooo");
      console.dir(req.body.regions);
      console.log("+++ regions +++");
      game.turns = game.turn++;
      console.log(game.turn);
      if (game.turns === game.players.length) game.gameStarted = 1;
      console.log("--- game #" + req.body.gameid + " ---");
      game.save();
      console.dir(game);
      return console.dir(game.regions[0]);
    });
  });

  app.use(function(error, req, res, next) {
    if (typeof error === typeof PageNotFoundError) {
      return res.render('error');
    } else {
      return res.render('error');
    }
  });

  app.listen(5000);

  console.log('Server started at ' + new Date());

}).call(this);
