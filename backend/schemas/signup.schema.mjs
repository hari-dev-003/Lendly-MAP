import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone:    { type: String, default: '' },
    address:  { type: String, default: '' },
    district: { type: String, default: '' },
    state:    { type: String, default: '' },

    // KYC
    kycStatus:   { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
    kycDocFront: { type: String, default: '' },
    kycDocBack:  { type: String, default: '' },
    kycSelfie:   { type: String, default: '' },
});

const Signup = mongoose.model('Signup', signupSchema);
export default Signup;
