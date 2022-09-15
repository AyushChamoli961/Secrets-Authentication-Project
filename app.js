//jshint esversion:6
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const app = express()
const mongoose = require("mongoose")
const encrypt = require("mongoose-encryption")

mongoose.connect("mongodb://localhost:27017/userDB" , {useNewUrlParser:true})

app.use(express.static("public"))
app.set("view engine" , "ejs")
app.use(bodyParser.urlencoded({
    extended: true
}))

const userSchema = new mongoose.Schema({
    email: String,
    password: String
})
const secret = "this is my darkest secret"
userSchema.plugin(encrypt, { secret: secret , encryptedFields: ["password"]});

const User = new mongoose.model("User",userSchema)

app.get("/",function(req,res){
    res.render("home")
})

app.get("/login",function(req,res){
    res.render("login")
})

app.get("/register",function(req,res){
    res.render("register")
})

app.post("/register" , function(req , res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    })
    newUser.save(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.render("secrets")
        }
    })
})

app.post("/login" , function(req,res){
    User.findOne({email:req.body.username , password:req.body.password} , function(err,found){
        if(found){
            res.render("secrets")
        }
        else{
            res.render("register")
        }
    })
})
app.listen(3000,function(req,res){
    console.log("Server started on port 3000");
})