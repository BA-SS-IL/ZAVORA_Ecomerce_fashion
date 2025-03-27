const express = require('express');
const router= express.Router();
const userController = require('../controllers/user/userController');
const productController = require('../controllers/user/productController');
const shopController = require('../controllers/user/shopController');
const profileController = require('../controllers/user/profileController');
const wishlistController = require('../controllers/user/wishlistController');
const addToCartController = require('../controllers/user/addToCartController');
const addressController = require('../controllers/user/addressController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const couponController = require('../controllers/user/couponController');
const walletController = require('../controllers/user/walletController');



const passport = require('passport');
const { userAuth,resetPasswordMiddleware } = require('../middlewares/auth');

router.get('/pageNotFound',userController.pageNotFound);

//sigup routes

router.get('/signup',userController.loadSignup);
router.post('/signup',userController.signup);
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOTP);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), async (req, res) => {
    try {
        req.session.user = req.user._id;
        res.redirect('/');
    } catch (error) {
        console.log("Google login error:", error);
        res.redirect('/signup');
}
});

//login routes
router.get("/login",userController.loadLogin);
router.post('/login',userController.login);

//home page $ shopping
router.get('/',userController.loadHomepage);
router.get('/logout',userController.logout);

//product Management
router.get('/productDetails',productController.productDetails)
router.get("/shop",shopController.loadShopPage)

router.get('/search', shopController.searchProducts);

//profile Management
router.get('/userProfile',userAuth,profileController.userProfile);
router.post("/update-profile",userAuth,profileController.updateProfile)

router.get("/change-email",userAuth,profileController.changeEmail)
router.post("/change-email",userAuth,profileController.changeEmailValid)
router.post("/verify-email-otp",userAuth,profileController.verifyEmailOtp)
router.post("/update-email",userAuth,profileController.updateEmail)


router.post("/change-password", userAuth, profileController.changePassword)


//wishlist management
router.get('/wishlist',userAuth,wishlistController.loadWishList)
router.post('/addToWishList',userAuth,wishlistController.addToWishList);
router.delete('/removeFromWishList',userAuth, wishlistController.removeFromWishList);


//Add To Cart
router.get('/cart',userAuth,addToCartController.loadAddToCart);
router.post('/addToCart',userAuth,addToCartController.addToCart);
router.post("/changeQuantity", userAuth, addToCartController.changeQuantity);
router.get("/deleteItem", userAuth, addToCartController.deleteProduct);



// address Management
router.get("/address",userAuth,addressController.loadAddressPage)
router.get("/addAddress",userAuth,addressController.addAddress)
router.post("/addAddress",userAuth,addressController.postAddAddress)
router.get("/editAddress",userAuth,addressController.editAddress);
router.post("/editAddress",userAuth,addressController.postEditAddress)
router.get("/deleteAddress",userAuth,addressController.deleteAddress)



// Checkout Management
router.get("/checkout",userAuth,checkoutController.loadCheckoutPage)
router.get("/addAddressCheckout",userAuth,checkoutController.addAddressCheckout)
router.post("/addAddressCheckout",userAuth,checkoutController.postAddAddressCheckout)


// Order Management
router.post("/placeOrder", userAuth, orderController.placeOrder);
router.get("/orders", userAuth, orderController.getOrders);
router.get("/order-details", userAuth, orderController.loadOrderDetails);

// New routes for order cancellation and returns
router.post("/orders/cancel", userAuth, orderController.cancelOrder);

//coupons
router.get("/mycoupons", userAuth, couponController.getUserCoupons);


/// wallet Management
router.get('/wallet',userAuth, walletController.loadWallet);
router.post('/wallet/create-razorpay-order', userAuth, walletController.createRazorpayOrder);
router.post('/wallet/verify-payment', userAuth, walletController.verifyPayment);
router.post('/wallet/withdraw-money', userAuth, walletController.withdrawMoney);
// router.post('/place-wallet-order', userAuth, orderController.placeWalletOrder);





module.exports = router;