const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');



const productDetails = async (req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);
        const productId = req.query.id;
        const product  = await Product.findById(productId).populate('category');
        const findCategory = product.category;
        const categoryOffer = findCategory ?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
        const totalOffer = categoryOffer + productOffer;

        const categories = await Category.find({isListed:true});

        let productData = await Product.find({
            isBlocked:false,
            category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        })


        productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        productData = productData.slice(0,10);
        res.render('productDetails',{
            user:userData,
            product:product,
            quantity:product.quantity,
            totalOffer:totalOffer,
            category:findCategory,
            products:productData

        })
    } catch (error) {
        console.error('Error for fetching productDetals',error);
        res.redirect('/pageNotFound')
    }
}

module.exports = {
    productDetails,
}