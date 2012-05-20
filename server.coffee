### 
Triumph
Realtime Risk-esque Multiplayer Game using Express, Redis, Mongo, jQuery
Author: Fouad Matin (@heyfouad) - github: matin
###
express = require("express")
mongoose = require("mongoose")
crypto = require("crypto")
__ = require("underscore")
RedisStore = require('connect-redis')(express)

redisConfig = 
  host: 'lab.redistogo.com'
  port: 9178
  pass: 'a0b72f75e8a375619350204056c54ff0'
  db: 'nodejitsu'

app = module.exports = express.createServer()
userNames = []
mongoose.connect "mongodb://nodejitsu:7d632d485ddb4fbfd696ade7a568d726@flame.mongohq.com:27023/nodejitsudb661488872412"
Schema = mongoose.Schema
ObjectId = Schema.ObjectId
Model = mongoose.Model
UserSchema = new Schema(
  username: String
  password: String
  wins:
    type: Number
    default: 0

  losses:
    type: Number
    default: 0

  email: String
  activeGames:
    type: [ GameSchema ]
    default: []

  history:
    type: [ GameSchema ]
    default: []

  sdate:
    type: Date
    default: Date.now
)
GameSchema = new Schema(
  id: Number
  players: [ String ]
  freeTroops: [ Number ]
  map:
    type: String
    default: "nyc"

  turn:
    type: Number
    default: 0

  regions: [ String ]
  gameStarted:
    type: Number
    default: 0
)
User = mongoose.model("User", UserSchema)
Game = mongoose.model("Game", GameSchema)
mongoose.connection.on "open", ->
  console.log "Mongoose connected"

notNames = [ "null" ]
app.configure ->
  app.set "views", __dirname + "/views"
  app.set "view engine", "ejs"
  app.use express.bodyParser()
  app.use express.cookieParser('pineapple')
  app.use express.methodOverride()
  app.use express.session 
    secret: 'joijeorj3904kr3'
    store: new RedisStore(redisConfig)
  app.use app.router
  app.use express.static(__dirname + "/public")
  app.set "view options",
    layout: false

app.locals.use (req, res) ->
  res.locals.req = req;
  res.locals.session = req.session;


app.configure "development", ->
  app.use express.errorHandler(
    dumpExceptions: true
    showStack: true
  )

app.configure "production", ->
  app.use express.errorHandler()

app.get "/", (req, res) ->
  return res.render("index")  unless req.session.username?
  User.findOne
    username: req.session.username
  , (err, user) ->
    res.render "home",
      activeGames: user.activeGames

app.get "/home", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  User.findOne
    username: req.session.username
  , (err, user) ->
    res.render "home",
      activeGames: user.activeGames

app.get "/signup", (req, res) ->
  res.render "signup",
    taken: false

app.post "/signup", (req, res) ->
  console.log "signup"
  pass = crypto.createHash("md5").update(req.body.user.pass).digest("hex")
  console.log pass
  console.log User.count(
    username: req.body.user.name
  , (err, count) ->
    count
  )
  User.count
    username: req.body.user.name
  , (err, count) ->
    console.log count
    if count is 0 and req.body.user.name.length isnt 0
      user = new User(
        username: req.body.user.name
        password: pass
        email: req.body.user.email
      )
      user.save (err, user_Saved) ->
        if err
          throw errconsole.log err
        else
          console.log "saved!"

      userNames.push req.body.user.name
      req.session.username = req.body.user.name
      res.redirect "/home"
    else
      res.render "signup",
        taken: true

app.get "/login", (req, res) ->
  if req.session.username?
    res.redirect "/home"
  else
    res.render "login",
      error: false

app.post "/login", (req, res) ->
  n = req.session.username
  console.log "username = " + n
  unless req.session.username?
    console.log "------"
    console.log "login"
    console.log "------"
    console.log req.body.user.name
    pass = crypto.createHash("md5").update(req.body.user.pass).digest("hex")
    console.log pass
    User.count
      username: req.body.user.name
      password: pass
    , (err, count) ->
      if count is 1
        req.session.username = req.body.user.name
        res.redirect "/home"
      else
        res.render "login",
          error: true

app.get "/logout", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  req.session.username = null
  res.redirect "/login"

app.get "/games", (req, res) ->
  res.redirect "/home"

app.get "/games/new", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  su = req.session.username
  res.render "newgame",
    error: false
    users: __.reject(userNames, (ur) ->
      ur is su
    )

app.post "/games/new", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  if typeof req.body.game.users is "undefined"
    su = req.session.username
    return res.render("newgame",
      error: "Do you not have any friends? C'mon, play with somebody."
      users: __.reject(userNames, (ur) ->
        ur is su
      )
    )
  req.body.game.users = [ req.body.game.users ]  unless __.isArray(req.body.game.users)
  console.log req.body.game.users.length
  if req.body.game.users.length > 3
    su = req.session.username
    return res.render("newgame",
      error: "Woah there! You have too many friends, you can only play with three."
      users: __.reject(userNames, (ur) ->
        ur is su
      )
    )
  pl = [ req.session.username ]
  pl = pl.concat(req.body.game.users)
  tUsers = []
  numPlayers = pl.length
  freeT = []
  mapName = req.body.game.map
  tRegions = []
  sRegions = []
  ii = 0

  while ii < numPlayers
    freeT.push 50
    ii++
  if mapName is "nyc"
    l = 0

    while l < 15
      if numPlayers is 2
        tRegions[l] = {}
        tRegions[l].player = l % 2
        tRegions[l].troops = 1
        sRegions[l] = JSON.stringify(tRegions[l])
        freeT[l % 2]--
      else if numPlayers is 3
        tRegions[l] = {}
        tRegions[l].player = l % 3
        tRegions[l].troops = 1
        sRegions[l] = JSON.stringify(tRegions[l])
        freeT[l % 3]--
      else if numPlayers is 4
        tRegions[l] = {}
        tRegions[l].player = l % 4
        tRegions[l].troops = 1
        sRegions[l] = JSON.stringify(tRegions[l])
        freeT[l % 4]--
      else
        return res.render("error")
      l++
  else
    console.log "oh damn"
    return res.render("/games/23923423")
  genID = ->
    console.log "--users--"
    console.log tUsers
    console.log "----"
    rand = Math.floor(Math.random() * 1000000000)
    Game.count
      id: rand
    , (err, count) ->
      if count is 1
        genID()
      else
        console.log "pl"
        console.log pl
        console.log "id"
        console.log rand
        g = new Game(
          id: rand
          players: pl
          freeTroops: freeT
          regions: sRegions
        )
        g.save (err, gameSaved) ->
          if err
            console.log "game did not save"
            console.log err
            res.render "error"
          else
            __.each pl, (uzn) ->
              User.findOne
                username: uzn
              , (err, unc) ->
                unc.activeGames.push g
                unc.save()

            console.log "game saved!"
            res.redirect "/games/" + rand

  genID()

app.get "/games", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  res.redirect "/home"

app.get "/games/:id", (req, res) ->
  return res.redirect("/login")  unless req.session.username?
  return res.redirect("/home")  if req.params.id is "past"
  Game.findOne
    id: req.params.id
  , (err, ga) ->
    return res.render("error")  if err
    console.log ga.regions
    console.log ga
    ind = 0
    i = 0

    User.findOne 
      username: req.session.username
    , (err, uf) ->
      console.log uf

    while i < ga.players.length
      if ga.players[i] is req.session.username
        ind = i
        break
      i++
    console.log ind
    console.log ga.players
    res.render "map",
      game: ga
      pNum: ind

app.get "/nyan", (req, res) ->
  res.render "error"

app.get "/mu-0e36082c-12fbbfb6-41f76021-6ee9b732", (req, res) ->
  "42"

app.use (error, req, res, next) ->
    if (typeof error == typeof PageNotFoundError) 
      res.render 'error'
    else 
        res.render 'error'

app.listen 5000
console.log 'Server started at ' + new Date()