import Booking from '../schemas/booking.schema.mjs';

const createBooking = async (req, res) => {
    try {
        const { itemId, itemTitle, itemImage, renter, owner, startDate, endDate, pricePerDay } = req.body;

        if (!itemId || !itemTitle || !renter || !owner || !startDate || !endDate || !pricePerDay) {
            return res.status(400).send({ message: 'Missing required fields' });
        }

        if (renter === owner) {
            return res.status(400).send({ message: 'You cannot book your own item' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end <= start) {
            return res.status(400).send({ message: 'End date must be after start date' });
        }

        const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = totalDays * pricePerDay;

        const booking = await Booking.create({
            itemId, itemTitle, itemImage: itemImage || '',
            renter, owner, startDate: start, endDate: end,
            totalDays, pricePerDay, totalPrice
        });

        res.status(201).send({ message: 'Booking created successfully', booking });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const getBookingsByUser = async (req, res) => {
    try {
        const { username } = req.params;
        const bookings = await Booking.find({
            $or: [{ renter: username }, { owner: username }]
        }).sort({ createdAt: -1 });

        res.status(200).send({ bookings });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, disputeReason } = req.body;

        const allowed = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'];
        if (!allowed.includes(status)) {
            return res.status(400).send({ message: 'Invalid status' });
        }

        const update = { status };
        if (status === 'disputed' && disputeReason) update.disputeReason = disputeReason;

        const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
        if (!booking) return res.status(404).send({ message: 'Booking not found' });

        res.status(200).send({ message: 'Booking status updated', booking });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const uploadHandoverPhotos = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, photos } = req.body; // type: "pre" | "post"

        if (!['pre', 'post'].includes(type)) {
            return res.status(400).send({ message: 'type must be "pre" or "post"' });
        }

        const field = type === 'pre' ? 'preHandoverPhotos' : 'postHandoverPhotos';
        const booking = await Booking.findByIdAndUpdate(
            id,
            { [field]: photos },
            { new: true }
        );

        if (!booking) return res.status(404).send({ message: 'Booking not found' });

        res.status(200).send({ message: 'Photos updated', booking });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).send({ message: 'Booking not found' });
        res.status(200).send({ booking });
    } catch (err) {
        res.status(500).send({ message: 'Internal Server Error', error: err.message });
    }
};

export { createBooking, getBookingsByUser, updateBookingStatus, uploadHandoverPhotos, getBookingById };
