
const User = require('../../models/userSchema');
const nodemailer = require('nodemailer');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const env = require('dotenv').config();
const bcrypt = require('bcrypt')


const pageNotFound = async(req,res)=>{
    try {
        res.render('page-404')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
}



const loadHomepage = async(req,res)=>{
    try {
        const user = req.session.user;
        const categories = await Category.find({isListed:true});
        let productData = await Product.find({
            isBlocked:false,
            category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        })

        productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        productData = productData.slice(0,10);

        if(user){
            const userData = await User.findOne({_id:user})
            res.render('home',{user:userData,products:productData})
        }else{
            return res.render('home',{products:productData});
        }
    } catch (error) {
        console.log('home page not found',error);
        res.redirect('/pageNotFound')
    }
}

//signup

const loadSignup = async(req,res)=>{
    
        try {
            if(!req.session.user){
                return res.render('signup')
            }else{
                res.redirect('/')
               
            }
        } catch (error) {
            res.redirect('/pageNotFound')
            
        }
}


//signup data 

function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}

async  function sendVerificationEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure : false,
            requireTLS :true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            } 
        })

        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Verify Your Account",
            text:`Your otp is ${otp}`,
            html:`<b>Your OTP : ${otp}</b>`
        })

        return info.accepted.length >0

    } catch (error) {
        console.error("Erro sending email",error)
        return false;
        
    }
}

const signup = async(req,res)=>{
    try {
        const {name,phone,email,password,cPassword,} = req.body;
        if(password !== cPassword){
           return res.render('signup',{message:"Password does not match"})
        }
        const findUser = await User.findOne({email});
        if(findUser){
            return res.render('signup',{message:'User with this email already exist'});
        }
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email,otp)
        if(!emailSent){
            return res.json('email-error') 
        }

        req.session.userOtp = otp;
        req.session.userData = {name,phone,email,password};

        
        res.render('verify-otp');
        console.log('OTP sent',otp)

    } catch (error) {
        console.error('signup error');
        res.redirect('/pageNotFound')
    }
}

//verify-OTP

const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }
}

const verifyOtp = async (req,res)=>{
    try {
        const {otp} = req.body;
        
        console.log("Entered OTP:", otp);
        console.log("Session OTP:", req.session.userOtp);

        
        if(otp.toString()===req.session.userOtp.toString()){
            const user = req.session.userData
            const passwordHash = await securePassword(user.password)
            
            const saveUserData =  new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
             
            await saveUserData.save();
            req.session.user = saveUserData._id;

            req.session.userOtp = null;
            req.session.userData = null;

            console.log("User successfully saved to DB!");

            res.json({success:true,redirectUrl:"/"})
           


        }else{
            res.status(400).json({success:false,message:"invalid otp please try again"})
        }
    } catch (error) {

        console.error("error verifing otp",error)
        res.status(500).json({success:false,message:"an error occure"})
        
    }
}



//resendOTP

const resendOTP = async (req,res)=>{
    try {
       const {email} = req.session.userData;
       if(!email){
        return res.status(400).json({success:false,message:"Email not found session"})
       }

       const otp = generateOtp();
       req.session.userOtp = otp;

       const emailSent = await sendVerificationEmail(email,otp);
       if(emailSent){
        console.log('Resend otp ',otp);
        res.status(200).json({success:true,message:"OTP Resend Successfully"})
       }else{
        res.status(500).json({success:false,message:"Failed to resent OTP. Please try again"});

       }

    } catch (error) {

        console.error('Error resending OTP ',error)
        res.status(500).json({success:false,message:"Internal Server Error. Please try again"});
        
    }
}



//LOGIN

const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render('login')
        }else{
            res.redirect('/')
            
        }
    } catch (error) {
        res.redirect('/pageNotFound')
        
    }
}

//login post

const login = async (req,res)=>{
    try {
        const {email,password} = req.body;
        console.log("req.body;",req.body)
        const findUser = await User.findOne({isAdmin:0,email});
        if(!findUser){
            return res.render("login",{message:"User Not found"})
        }
        if(findUser.isBlocked){
            return res.render("login",{message:"User is Blocked By admin"})
        }

        const passwordMatch = await bcrypt.compare(password,findUser.password)
        
        if(!passwordMatch){
            return res.render('login',{message:"Icorrect Password"});
        }
        req.session.user = findUser.id;
        res.redirect('/')

    } catch (error) {
        console.error('login error',error);
        res.render("login",{message:"login Failed. please try again later"})
        
    }
}

//logout
const logout = async (req,res)=>{
    try {
        
        req.session.destroy((err)=>{
            if(err){
               console.log("session destruction error",err.message);
               return res.redirect("/pageNotFound")
            }
            return res.redirect('/login')
        })

    } catch (error) {

        console.log("logout error",error);
        res.redirect('/pageNotFound');
        
    }

}


const searchProducts = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = await User.findOne({ _id: user });

        const searchQuery = req.query.search; // Get the search query from the URL
        const categories = await Category.find({ isListed: true });

        // Fetch product count for each category
        const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
            const count = await Product.countDocuments({ 
                category: category._id, 
                isBlocked: false, 
                quantity: { $gt: 0 } 
            });
            return { _id: category._id, name: category.name, productCount: count };
        }));

        // Query products based on the search term
        const products = await Product.find({
            isBlocked: false,
            quantity: { $gt: 0 },
            $or: [
                { name: { $regex: searchQuery, $options: 'i' } }, // Case-insensitive search
                { description: { $regex: searchQuery, $options: 'i' } }, // Search in description
            ],
        }).sort({ createdOn: -1 });

        // Pagination logic
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;
        const totalProducts = products.length;
        const totalPages = Math.ceil(totalProducts / limit);

        const paginatedProducts = products.slice(skip, skip + limit);

        res.render("shop", {
            user: userData,
            products: paginatedProducts,
            category: categoriesWithCounts,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            searchQuery: searchQuery, // Pass the search query to the view
            req: req,
        });

    } catch (error) {
        console.error("Error searching products:", error);
        res.redirect("/pageNotFound");
    }
};







module.exports = {
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOTP,
    loadLogin,
    login,
    logout,
    
}