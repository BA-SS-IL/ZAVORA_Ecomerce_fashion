const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    productName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    productOffer: {
        discount_percentage: {
            type: Number,
            default: 0
        },
        start_date: {
            type: Date
        },
        end_date: {
            type: Date
        }
    },
    quantity: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    productImage: {
        type: [String],
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['available', 'out of stock', 'Discontinued'],
        required: true,
        default: 'available'
    }
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;