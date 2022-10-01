require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const app = express()
const mongoose = require("mongoose")
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require("mongoose-findorcreate")




app.use(express.static("public"))
app.set("view engine" , "ejs")
app.use(bodyParser.urlencoded({
    extended: true
})) 
app.use(session ({
    secret: "our little secret",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb+srv://AyushChamoli:eQQ76EcUZVQFV6xB@cluster0.hj0m1co.mongodb.net/userDB",{useNewurlParser:true})


const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret : String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User",userSchema)
passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://nameless-reef-40407.herokuapp.com/auth/google/secrets",
    scope: [ 'profile' ],
    state: true
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user)
    })
  }
))

app.get("/",function(req,res){
    res.render("home")
})
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
 function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.get("/secrets" , function(req,res){
   User.find({"secret" : {$ne: null}} , function(err , found){
    if(found){
        console.log(found);
        res.render("secrets" , {userWithSecrets : found})
    }
    else{
        console.log(err);
    }
   })
    
})

app.get("/logout" , function(req,res){
    req.logout(function(err){
        if(err){
            console.log()
        }
        else{
            res.render("/")
        }

    })
    res.redirect("/")
})

app.get("/submit" , function(req , res){
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect("login")
    }
})
app.post("/submit", function(req, res){
  
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = req.body.secret
          foundUser.save(function(){
            res.redirect("/secrets")
          })
        }
      }
    })
  })

app.post("/register" , function(req , res){
   User.register({username: req.body.username} , req.body.password ,function(err,result){
    if(err){
        console.log(err);
        res.render("register")
    }
    else{
        passport.authenticate("local")(req , res ,function(){
            res.redirect("/secrets")
        })

    }
   })
})

app.post("/login", function(req, res){

    const user = new User({
      username: req.body.username,
      password: req.body.password
    });
  
    req.login(user, function(err){
      if (err) {
        res.send("Please register first")
        console.log(err)
      } else {
        passport.authenticate("local")(req, res, function(){
          res.redirect("/secrets")
        });
      }
    })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on  localhost 3000");
});
