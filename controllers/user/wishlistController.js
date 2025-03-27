const User = require('../../models/userSchema');
const Product = require('../../models/productSchema')



const loadWishList = async (req,res)=>{
    try {
        const userId = req.session.user;
        const user = await User.findById(userId);
        const products  = await Product.find({_id:{$in:user.wishlist}}).populate('category');

        res.render('wishlist',{
            user,
            wishlist:products,
        })
    } catch (error) {
        console.error(error);
        res.redirect('/pageNotFound');
    }
}


const addToWishList = async (req,res)=>{
    try {
        const productId = req.body.productId;
        const userId = req.session.user;
        const user = await User.findById(userId);
        if(user.wishlist.includes(productId)){

            return res.status(200).json({status:false,message:'product already in wishlist'});

        }
        user.wishlist.push(productId);
        await user.save();
        return res.status(200).json({status:true,message:'product added to wishlist'})
    } catch (error) {
        console.error(error)
        return res.status(500).json({status:false,message:"server error"})
    }
}


const removeFromWishList = async (req, res) => {
    try {
        const { productId } = req.body;
        console.log("Product ID:", productId);

        // Find user and remove product from wishlist
        const result = await User.findOneAndUpdate(
            { _id: req.session.user },
            { $pull: { wishlist: productId } }, // Remove product from wishlist array
            { new: true } // Return updated document
        );

        console.log("Updated Wishlist:", result.wishlist);

        if (result) {
            res.json({ status: true, message: "Removed from wishlist" });
        } else {
            res.json({ status: false, message: "Product not found in wishlist" });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ status: false, message: "Server error" });
    }
};



module.exports = {
    loadWishList,
    addToWishList,
    removeFromWishList,

}