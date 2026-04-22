import Razorpay from 'razorpay';
import crypto from 'crypto';
import Booking from '../schemas/booking.schema.mjs';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
    try {
        const { bookingId, amount } = req.body;
        if (!bookingId || !amount) return res.status(400).send({ message: 'bookingId and amount required' });

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // paise
            currency: 'INR',
            receipt: `booking_${bookingId}`,
            notes: { bookingId },
        });

        res.status(200).send({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Failed to create order', error: err.message });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).send({ message: 'Invalid payment signature' });
        }

        await Booking.findByIdAndUpdate(bookingId, {
            status: 'confirmed',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        });

        res.status(200).send({ message: 'Payment verified. Booking confirmed!', paymentId: razorpay_payment_id });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Verification failed', error: err.message });
    }
};
