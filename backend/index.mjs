import express from 'express';
import connection from './db/db.mjs';
import { signup, login, updateProfile, getProfile } from './controllers/login.mjs';
import cors from 'cors';
import { getusers } from './controllers/users.mjs';
import { uploadImage } from './controllers/photoupload.mjs';
import upload from './middleware/upload.mjs';
import { getProducts, getProductById } from './controllers/productfetch.mjs';
import { createBooking, getBookingsByUser, updateBookingStatus, uploadHandoverPhotos, getBookingById } from './controllers/booking.mjs';
import { createReview, getItemReviews, getUserReviews } from './controllers/review.mjs';

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true
}));

const PORT = 3000;

// Health
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Auth
app.post('/api/signup', signup);
app.post('/api/login', login);

// Profile
app.get('/api/profile/:username', getProfile);
app.put('/api/profile', updateProfile);

// Users
app.get('/api/users', getusers);

// Products
app.post('/api/upload', upload.single('image'), uploadImage);
app.get('/api/products', getProducts);
app.get('/api/products/:id', getProductById);

// Bookings
app.post('/api/bookings', createBooking);
app.get('/api/bookings/user/:username', getBookingsByUser);
app.get('/api/bookings/:id', getBookingById);
app.patch('/api/bookings/:id/status', updateBookingStatus);
app.patch('/api/bookings/:id/photos', uploadHandoverPhotos);

// Reviews
app.post('/api/reviews', createReview);
app.get('/api/reviews/item/:itemId', getItemReviews);
app.get('/api/reviews/user/:username', getUserReviews);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
