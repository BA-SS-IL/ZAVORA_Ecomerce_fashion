
const User = require('../../models/userSchema')
const Address = require("../../models/addressSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
// const securePassword = require("../../utils/securePassword");
const env = require("dotenv").config();
const session = require("express-session")
const multer = require("multer")
const sharp = require("sharp")
const fs = require("fs")
const path = require("path")




//user profile

const userProfile = async (req,res)=>{
    try {
        const userId  = req.session.user;    
        const userData = await User.findOne({_id:userId})
        res.render('profile',{
            user:userData
        })
    } catch (error) {
        console.log('error for retrieving profile data ',error)
        res.redirect('/pageNotFound');
    }
}


function generateOtp(){
    const digits = "1234567890"
    let otp = "";
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp 
}

const sendVerificationEmail = async (email,otp) => {
    try {
        
        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD,
            }
        })

        const mailOption = {
            from: process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Your OTP for password reset",
            text:`Your OTP is ${otp}`,
            html:`<b><h4>Your OTP : ${otp}</h4><br></b>`,

        }

        const info = await transporter.sendMail(mailOption);
        console.log("Email sent:",info.messageId)

        return true;

    } catch (error) {

        console.error("error sending email",error);
        return false
        
    }
}




const changeEmail = async (req,res) => {
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        res.render("change-email",{
            user:userData
        })

    } catch (error) {

        res.redirect("/pageNotFound")
        
    }
}

const changeEmailValid = async (req,res) => {
    try {
        
        const {email} = req.body;
        const userExist = await User.findOne({email});
        if(userExist){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent) {
                req.session.userOtp = otp;
                req.session.userdata = req.body;
                req.session.email = email;
                res.render("change-email-otp");
                console.log(`Email Sent : ${email}, Otp: ${otp}`)
            }else {
                res.json("email-error")
            }
        }else{
            res.render("change-email",{
                message: "User with email not exist"
            })
        }

    } catch (error) {

        res.redirect("/pageNotFound")
        
    }
}

const verifyEmailOtp = async (req,res) => {
    try {

        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            req.session.userData = req.body.userData;
            res.render("new-email",{
                userData: req.session.userData,
            })
        }else{
            res.render("change-email-otp",{
                message:"OTP not Matching",
                userData: req.session.userData,
            })
        }
        
    } catch (error) {

        res.redirect("/pageNotFound")
        
    }
}

const updateEmail = async (req,res) => {
    try {
        
        const newEmail = req.body.newEmail;
        const userId = req.session.user;
        await User.findByIdAndUpdate(userId,{
            email:newEmail,
        })
        res.redirect("/userProfile")

    } catch (error) {

        res.redirect("/pageNotFound")
        
    }
}


const updateProfile = async (req, res) => {
    try {
        const userId = req.session.user;
        const { name, username, phone } = req.body;

        // Validate phone number
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit phone number'
            });
        }

        // Check if username is already taken
        if (username) {
            const existingUser = await User.findOne({
                username,
                _id: { $ne: userId }
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username is already taken. Please choose a different one.'
                });
            }
        }

        // Update user profile
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, username, phone },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating your profile'
        });
    }
};




const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.session.user; 
        console.log(req.session.user)

        // Server-side validation
        if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long and contain both letters and numbers.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'Passwords do not match.' });
        }

        // Fetch the user from the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Check if the current password is correct
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'current_password_incorrect', message: 'Current password is incorrect.' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: 'An error occurred while changing the password.' });
    }
};



module.exports = {
    userProfile,
    changePassword,
    changeEmail,
    changeEmailValid,
    updateEmail,
    verifyEmailOtp,
    updateProfile





}