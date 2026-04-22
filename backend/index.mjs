import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import './db/db.mjs';
import cors from 'cors';

import { signup, login, updateProfile, getProfile } from './controllers/login.mjs';
import { getusers } from './controllers/users.mjs';
import { uploadImage } from './controllers/photoupload.mjs';
import upload from './middleware/upload.mjs';
import { getProducts, getProductById } from './controllers/productfetch.mjs';
import { createBooking, getBookingsByUser, getAllBookings, updateBookingStatus, uploadHandoverPhotos, getBookingById } from './controllers/booking.mjs';
import { createReview, getItemReviews, getUserReviews, getAllReviews } from './controllers/review.mjs';
import { createOrder, verifyPayment } from './controllers/payment.mjs';
import { submitKyc, getKycStatus, reviewKyc, getPendingKyc } from './controllers/kyc.mjs';
import { getMessages } from './controllers/message.mjs';
import Message from './schemas/message.schema.mjs';

const app = express();
const httpServer = createServer(app);

const ALLOWED_ORIGINS = ['http://localhost:8080', 'http://localhost:8081'];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

const io = new Server(httpServer, { cors: corsOptions });

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cors(corsOptions));

const PORT = 3000;

// ── Socket.io real-time chat ──────────────────────────────────────────────────
io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
        socket.join(room);
    });

    socket.on('send_message', async ({ room, sender, text }) => {
        try {
            const msg = await Message.create({ room, sender, text });
            io.to(room).emit('receive_message', msg);
        } catch (err) {
            console.log('Chat error:', err.message);
        }
    });

    socket.on('disconnect', () => {});
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('Server is running'));

// ── Auth ──────────────────────────────────────────────────────────────────────
app.post('/api/signup', signup);
app.post('/api/login', login);

// ── Profile ───────────────────────────────────────────────────────────────────
app.get('/api/profile/:username', getProfile);
app.put('/api/profile', updateProfile);

// ── Users ─────────────────────────────────────────────────────────────────────
app.get('/api/users', getusers);

// ── Products ──────────────────────────────────────────────────────────────────
app.post('/api/upload', upload.single('image'), uploadImage);
app.get('/api/products', getProducts);
app.get('/api/products/:id', getProductById);

// ── Bookings ──────────────────────────────────────────────────────────────────
app.post('/api/bookings', createBooking);
app.get('/api/bookings', getAllBookings);
app.get('/api/bookings/user/:username', getBookingsByUser);
app.get('/api/bookings/:id', getBookingById);
app.patch('/api/bookings/:id/status', updateBookingStatus);
app.patch('/api/bookings/:id/photos', uploadHandoverPhotos);

// ── Reviews ───────────────────────────────────────────────────────────────────
app.post('/api/reviews', createReview);
app.get('/api/reviews', getAllReviews);
app.get('/api/reviews/item/:itemId', getItemReviews);
app.get('/api/reviews/user/:username', getUserReviews);

// ── Payments ──────────────────────────────────────────────────────────────────
app.post('/api/payments/create-order', createOrder);
app.post('/api/payments/verify', verifyPayment);

// ── KYC ───────────────────────────────────────────────────────────────────────
app.post('/api/kyc/submit', upload.fields([{ name: 'docFront', maxCount: 1 }, { name: 'docBack', maxCount: 1 }]), submitKyc);
app.get('/api/kyc/status/:username', getKycStatus);
app.post('/api/kyc/review', reviewKyc);
app.get('/api/kyc/pending', getPendingKyc);

// ── Messages ──────────────────────────────────────────────────────────────────
app.get('/api/messages/:room', getMessages);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
