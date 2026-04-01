import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    itemTitle: { type: String, required: true },
    itemImage: { type: String, default: '' },
    renter: { type: String, required: true },
    owner: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalDays: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'],
        default: 'pending'
    },
    preHandoverPhotos: [{ type: String }],
    postHandoverPhotos: [{ type: String }],
    disputeReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
