import Signup from '../schemas/signup.schema.mjs';
import cloudinary from '../config/cloudinary.mjs';

export const submitKyc = async (req, res) => {
    try {
        const { username, selfieUrl } = req.body;

        const update = { kycStatus: 'pending', kycSelfie: selfieUrl || '' };

        if (req.files?.docFront?.[0]) {
            const front = await cloudinary.uploader.upload(req.files.docFront[0].path, { folder: 'lendly_kyc' });
            update.kycDocFront = front.secure_url;
        }
        if (req.files?.docBack?.[0]) {
            const back = await cloudinary.uploader.upload(req.files.docBack[0].path, { folder: 'lendly_kyc' });
            update.kycDocBack = back.secure_url;
        }

        const user = await Signup.findOneAndUpdate({ username }, update, { returnDocument: 'after' });
        if (!user) return res.status(404).send({ message: 'User not found' });

        res.status(200).send({ message: 'KYC submitted for review', kycStatus: user.kycStatus });
    } catch (err) {
        console.log(err.message);
        res.status(500).send({ message: 'KYC submission failed', error: err.message });
    }
};

export const getKycStatus = async (req, res) => {
    try {
        const user = await Signup.findOne({ username: req.params.username }, 'kycStatus kycDocFront kycDocBack kycSelfie');
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.status(200).send({ kycStatus: user.kycStatus, docs: { front: user.kycDocFront, back: user.kycDocBack, selfie: user.kycSelfie } });
    } catch (err) {
        res.status(500).send({ message: 'Error', error: err.message });
    }
};

export const reviewKyc = async (req, res) => {
    try {
        const { username, action } = req.body; // action: 'approve' | 'reject'
        const kycStatus = action === 'approve' ? 'approved' : 'rejected';
        const user = await Signup.findOneAndUpdate({ username }, { kycStatus }, { returnDocument: 'after' });
        if (!user) return res.status(404).send({ message: 'User not found' });
        res.status(200).send({ message: `KYC ${kycStatus}`, kycStatus });
    } catch (err) {
        res.status(500).send({ message: 'Error', error: err.message });
    }
};

export const getPendingKyc = async (req, res) => {
    try {
        const users = await Signup.find({ kycStatus: 'pending' }, 'username email kycDocFront kycDocBack kycSelfie kycStatus');
        res.status(200).send({ users });
    } catch (err) {
        res.status(500).send({ message: 'Error', error: err.message });
    }
};
