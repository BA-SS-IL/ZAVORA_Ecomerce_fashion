const Category = require('../../models/categorySchema');
const Product = require('../../models/productSchema')



// Category Info
const categoryInfo = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categoryData = await Category.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / limit);
        res.render('category', {
            cat: categoryData,
            currentPage: page,
            totalPages: totalPages,
            totalCategories: totalCategories
        });
    } catch (error) {
        console.error(error);
        res.redirect('/pageerror');
    }
};
//addCategory

const addCategory = async(req,res)=>{

        const {name,description} = req.body;
        try {
            const existingCategory = await Category.findOne({name})
            if(existingCategory){
                return res.status(400).json({error:"Category already exists"})
            }
            const newCategory = new Category({
                name,
                description,
            })
            await newCategory.save();
            return res.json({message:"Category added successfully"})
        } catch (error) {
            return res.status(500).json({error:"Internal server error"})
        }
}


const addCategoryOffer = async (req, res) => {
    try {
        const { categoryId, discountPercentage, startDate, endDate } = req.body;
  
        if (!categoryId || !discountPercentage || !startDate || !endDate) {
            return res.status(400).json({ status: false, message: "All fields are required" });
        }
  
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }
  
        // Set the category offer
        category.categoryOffer = {
            discount_percentage: parseFloat(discountPercentage),
            start_date: new Date(startDate),
            end_date: new Date(endDate)
        };
        await category.save();
  
        // Update all products in the category
        const products = await Product.find({ category: category._id });
        for (const product of products) {
            const productDiscount = product.productOffer && product.productOffer.discount_percentage > 0 ? product.productOffer.discount_percentage : 0;
            const categoryDiscount = category.categoryOffer.discount_percentage;
            const bestDiscount = Math.max(productDiscount, categoryDiscount);
            product.salePrice = product.regularPrice * (1 - bestDiscount / 100);
            await product.save();
        }
  
        res.json({ status: true, message: "Category offer added and sale prices reduced successfully" });
    } catch (error) {
        console.error('Error adding category offer:', error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
  };

  const removeCategoryOffer = async (req, res) => {
    try {
        const { categoryId } = req.body;
  
        if (!categoryId) {
            return res.status(400).json({ status: false, message: "Category ID is required" });
        }
  
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ status: false, message: "Category not found" });
        }
  
        // Remove category offer
        category.categoryOffer = { discount_percentage: 0, start_date: null, end_date: null };
        await category.save();
  
        // Update all products in the category
        const products = await Product.find({ category: category._id });
        for (const product of products) {
            const productDiscount = product.productOffer && product.productOffer.discount_percentage > 0 ? product.productOffer.discount_percentage : 0;
            const bestDiscount = productDiscount;
            product.salePrice = bestDiscount > 0 ? product.regularPrice * (1 - bestDiscount / 100) : product.regularPrice;
            await product.save();
        }
  
        res.json({ status: true, message: "Category offer removed and sale prices adjusted successfully" });
    } catch (error) {
        console.error('Error removing category offer:', error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
  };
  
//Get List Category
const getListCategory = async (req,res)=>{
    try {
       let id = req.query.id;
       await  Category.updateOne({_id:id},{$set:{isListed:true}});
       res.redirect('/admin/category');
    } catch (error) {
        res.redirect('/pageerror');
    }
}


// get Unlinst Category

const getUnlistCategory = async (req,res)=>{
    try {
        let id = req.query.id;
        await  Category.updateOne({_id:id},{$set:{isListed:false}});
            res.redirect('/admin/category');
       
    } catch (error) {
        res.redirect('/pageerror');
    }
}

//get edit Cateogry

const getEditCategory = async (req,res)=>{
    try {
        const id = req.query.id;
        const category = await Category.findById(id);
        console.log(category);
        
        res.render('edit-category',{category:category});
    } catch (error) {
        res.redirect('/pageerror')
    }
}

//edit Category
const editCategory = async (req,res)=>{
    try {
        const id = req.params.id;
        const {categoryName,description} = req.body;
        const existingCategory = await Category.findOne({name:categoryName});


        if(existingCategory){
            return res.status(400).json({error:"Category exists,please choose another name"});
        }
        const upadateCategory = await Category.findByIdAndUpdate(id,{
            name:categoryName,
            description:description,  
        },{new:true});

        if(upadateCategory){
            res.redirect('/admin/category')
        }else{
            res.status(404).json({error:"Category not found"})
        }


    } catch (error) {
        res.status(500).json({error:"Internal servr error"})
    }
}


module.exports = {
    categoryInfo,
    addCategory,
    addCategoryOffer,
    removeCategoryOffer,
    getListCategory,
    getUnlistCategory,
    getEditCategory,
    editCategory,

}
