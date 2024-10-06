const express = require('express');
const User=require('../models/user')
const router=express.Router();
const passport=require("passport");
const {isLoggedIn}=require('../middleware')
router.get('/register',(req,res)=>{
    res.render('users/register')
})

router.post('/register',async(req,res)=>{
    try{
    const {email,username,password}=req.body;
    const u=new User({email,username});
    const registerUser=await User.register(u,password)
    await registerUser.save();
    console.log(registerUser);
    res.redirect('/book')
    }
    catch(e){
        req.flash('error',e.message);
        res.redirect('register');
    }
})

router.get('/login',(req,res)=>{
    res.render('users/login')
})
router.post('/login',passport.authenticate('local',{ failureFlash: true, failureRedirect: '/login' }),async(req,res)=>{
    req.flash('success','welcome back');
    res.redirect('/book');
})
router.get('/logout', (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'Goodbye!');
        res.redirect('/');
    });
}); 
module.exports=router;