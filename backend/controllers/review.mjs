import Review from '../schemas/review.schema.mjs';

const createReview = async (req, res) => {
    try {
        const { itemId, bookingId, reviewer, reviewee, rating, comment, type } = req.body;

        if (!itemId || !bookingId || !reviewer || !reviewee || !rating || !type) {
            return res.status(400).send({ message: 'Missing required fields' });
        }

        // One review per booking per reviewer
        const existing = await Review.findOne({ bookingId, reviewer });
        if (existing) {
            return res.status(400).send({ message: 'You have already reviewed this booking' });
        }

        const review = await Review.create({ itemId, bookingId, reviewer, reviewee, rating, comment, type });
        res.status(201).send({ message: 'Review submitted', review });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const getItemReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ itemId: req.params.itemId }).sort({ createdAt: -1 });
        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        res.status(200).send({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length });
    } catch (err) {
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.username }).sort({ createdAt: -1 });
        const avgRating = reviews.length
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        res.status(200).send({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length });
    } catch (err) {
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

export { createReview, getItemReviews, getUserReviews };
