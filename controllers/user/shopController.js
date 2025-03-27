
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const User = require('../../models/userSchema');


const loadShopPage = async (req, res) => {
    try {
        // Get user data if authenticated
        const user = req.session.user;
        const userData = user ? await User.findOne({ _id: user }) : null;

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        // Build query object
        let query = {
            isBlocked: false,
            quantity: { $gt: 0 }
        };

        // Add search functionality
        if (req.query.search) {
            query.productName = { $regex: req.query.search, $options: 'i' };
        }

        // Get categories and ensure they're listed
        const categories = await Category.find({ isListed: true });
        const categoryIds = categories.map(category => category._id);
        query.category = { $in: categoryIds };

        // Determine sort order
        let sort = {};
        switch (req.query.sort) {
            case 'popularity':
                sort = { popularity: -1 };
                break;
            case 'price_asc':
                sort = { salePrice: 1 };
                break;
            case 'price_desc':
                sort = { salePrice: -1 };
                break;
            case 'rating':
                sort = { averageRating: -1 };
                break;
            case 'featured':
                sort = { featured: -1 };
                break;
            case 'new':
                sort = { createdAt: -1 };
                break;
            case 'name_asc':
                sort = { productName: 1 };
                break;
            case 'name_desc':
                sort = { productName: -1 };
                break;
            default:
                sort = { createdAt: -1 }; // Default sort by newest
        }

        // Get category counts using aggregation
        const categoriesWithCounts = await Category.aggregate([
            {
                $match: { isListed: true }
            },
            {
                $lookup: {
                    from: 'products',
                    let: { categoryId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$category', '$$categoryId'] },
                                        { $eq: ['$isBlocked', false] },
                                        { $gt: ['$quantity', 0] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'products'
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    productCount: { $size: '$products' }
                }
            }
        ]);

        // Fetch products with pagination and sorting
        const products = await Product.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        // Get total number of products for pagination
        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Render shop page with all necessary data
        res.render("shop", {
            user: userData,
            products: products,
            category: categoriesWithCounts,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            search: req.query.search,
            sort: req.query.sort,
            req: req
        });

    } catch (error) {
        console.error("Error loading shopping page:", error);
        res.status(500).redirect("/pageNotFound");
    }
};


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
    loadShopPage,
    searchProducts
}