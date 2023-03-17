//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// to avoid deprecation warning
mongoose.set('strictQuery', true);

// if database is present, it'll connect to it otherwise first it'll create and then connect
mongoose.connect('mongodb://127.0.0.1:27017/userDB' , {useNewUrlParser: true });

const userSchema = {
    email: String,
    password: String
}

const User = new mongoose.model("User" , userSchema);

app.get("/" , function(req , res){
    res.render("home");
})

app.get("/login" , function(req , res){
    res.render("login");
})

app.get("/register" , function(req , res){
    res.render("register");
})

app.post("/register" , function(req , res){

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })

    newUser.save(function(err){
        if(!err)console.log("New user got the pass"),res.render("secrets")
        else console.log(err);
    })
});

app.post("/login" , function(req , res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username} , function(err , foundUser){
        if(err)console.log(err);
        else{
            if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");
            }
        }
        }
    })
})
app.listen(3000, function() {
  console.log("Server started on port 3000");
});