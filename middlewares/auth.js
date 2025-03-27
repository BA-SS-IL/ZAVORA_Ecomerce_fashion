const User = require('../models/userSchema');


//userAuth
const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect('/login')
            }
        })
        .catch(error=>{
            console.log('Error in Useer auth middleware');
            res.status(500).send("internal server error");
            
        })

    }else{
        res.redirect('/login');
    }
}


//adminAuth

const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next();
        }else{
            res.redirect('/admin/login')
        }
    })
    .catch(error=>{
        console.log('Error in Admin Auth middleware');
        res.status(500).send('Internal server Error in middleware')
    })
}


const resetPasswordMiddleware = (req, res, next) => {
    if (req.session.resetAllowed) {
        return next();  // ✅ Allow access if OTP was verified
    } else {
        return res.redirect("/forgot-password");  // ❌ Redirect unauthorized users
    }
};


module.exports = {
    userAuth,
    adminAuth,
    resetPasswordMiddleware,
}