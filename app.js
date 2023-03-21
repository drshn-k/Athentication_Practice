//jshint esversion:6
require('dotenv').config()
// console.log(process.env.SECRET);


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const app = express();

// Passport.js

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// to avoid deprecation warning
mongoose.set('strictQuery', true);

app.use(session({
    secret: "I am the man of my word.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); 
app.use(passport.session());
// if database is present, it'll connect to it otherwise first it'll create and then connect
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

passport.use(User.createStrategy());
 
// passport.serializeUser(User.serializeUser()) ;
// passport.deserializeUser(User.deserializeUser());

// passport.serializeUser(function(user, cb) {
//   process.nextTick(function() {
//     return cb(null, user.id);
//   });
// });

// passport.deserializeUser(function(id, cb) {
//   User.get('SELECT * FROM users WHERE id = ?', [ id ], function(err, user) {
//     if (err) { return cb(err); }
//     return cb(null, user);
//   });
// });

passport.serializeUser(function(user, done) {
  done(null, user.id); 
 // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
      done(err, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.get("/secrets" , function(req ,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));


  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.post("/register", function (req, res) {

    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     })

    //     newUser.save(function (err) {
    //         if (!err) console.log("New user got the pass"), res.render("secrets")
    //         else console.log(err);
    //     })
    // });

    User.register({username: req.body.username}, req.body.password , function(err , user){
        if(err){
            console.log(err);
            res.redirect('/register');
        }else{
            passport.authenticate("local")(req, res , function(){
                res.redirect("/secrets");
            });
        }
    });




});

app.post("/login", function (req, res) {
  
  const user = new User({
    username : req.body.username,
    password: req.body.password
  })

  req.login(user , function(err , user){
    if(err)console.log(err);

    else{
        passport.authenticate("local")(req, res , function(){
            res.redirect("/secrets");
        });
    }
  })
  
  
    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({ email: username }, function (err, foundUser) {
    //     if (err) console.log(err);
    //     else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (result == true) res.render('secrets');
    //             });
    //             // if(foundUser.password === password){
    //             //     res.render("secrets");
    //             // }
    //         }
    //     }
    // })
});
app.listen(3000, function () {
    console.log("Server started on port 3000");
});