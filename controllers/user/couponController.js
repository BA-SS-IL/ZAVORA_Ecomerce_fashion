const Coupon = require("../../models/couponSchema");

const getUserCoupons = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch only active (non-expired) coupons
        const coupons = await Coupon.find({
            expireOn: { $gte: today } // Coupons that haven't expired
        }).sort({ createdOn: -1 });

        res.render("myCoupons", {
            coupons,
            title: "Available Coupons",
            user: req.session.user || null // Assuming user session is stored here
        });
    } catch (error) {
        console.error("Error fetching user coupons:", error);
        res.redirect("/pageerror");
    }
};

module.exports = {
    getUserCoupons
};