const User = require('../../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//page error
const pageerror = (req,res)=>{
    res.render('pageerror')
}


//login render

const loadLogin = (req,res)=>{
    if(req.session.admin){
        return res.redirect("/admin/")
    }
    res.render('adminLogin', { message: null });

}


//login post

const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        console.log("req.body:",req.body);
        const admin = await User.findOne({email,isAdmin:true});
        if(admin){
            const passwordMatch =  await bcrypt.compare(password,admin.password);
        
        if(passwordMatch){
            req.session.admin = true;
            return res.redirect('/admin')
        }else{
            return res.redirect('/admin/login')
        }
    }else{
        return res.redirect('/admin/login')
    }
    } catch (error) {
        console.log('login error admin',error);
        return res.redirect('/pageerror');
    }
}


//dashboard

const loadDashboard = async (req,res)=>{
    try {
if(req.session.admin){

    res.render('dashboard');
}else{
    res.redirect('/admin/login')
}
        
    } catch (error) {
        res.redirect('/pageerror')
    }
}


//logout
const logout = async (req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log('Error destroying  session ',err);
                return res.redirect('/pageerror');
            }
            res.redirect('/admin/login');
        })
    } catch (error) {
        console.log(("unexpectd error during logout",error));
        res.redirect('/pageerror')

    }
}


module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
}