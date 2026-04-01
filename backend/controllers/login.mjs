import Signup from '../schemas/signup.schema.mjs';


const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const user = await Signup.findOne({ email });

        if (user) {
            return res.status(400).send({ message: 'User already exists' });
        }

        const newuser = await Signup.create({
            username,
            email,
            password
        });

        res.status(201).send({
            message: 'User created successfully',
            user: newuser
        });

    } catch (err) {
        console.log(err.message);

        res.status(500).send({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};



const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await Signup.findOne({ email });

        if (!user) {
            return res.status(400).send({ message: 'User does not exist' });
        }

        if (user.password !== password) {
            return res.status(400).send({ message: 'Invalid Credentials' });
        }

        res.status(200).send({
            message: 'Login Successful',
            user
        });

    } catch (err) {

        console.log(err.message);

        res.status(500).send({
            message: 'Internal Server Error',
            error: err.message
        });

    }
};



const updateProfile = async (req, res) => {
    try {

        const { username, phone, address, district, state } = req.body;

        const user = await Signup.findOne({ username });

        if (!user) {
            return res.status(404).send({
                message: 'User not found'
            });
        }

        user.phone = phone;
        user.address = address;
        user.district = district;
        user.state = state;

        await user.save();

        res.status(200).send({
            message: 'Profile updated successfully',
            user
        });

    } catch (err) {

        console.log(err.message);

        res.status(500).send({
            message: 'Internal Server Error',
            error: err.message
        });

    }
};



const getProfile = async (req, res) => {
    try {

        const { username } = req.params;

        const user = await Signup.findOne({ username });

        if (!user) {
            return res.status(404).send({
                message: "User not found"
            });
        }

        res.status(200).send({
            user
        });

    } catch (err) {

        console.log(err.message);

        res.status(500).send({
            message: "Internal Server Error",
            error: err.message
        });

    }
};



export { signup, login, updateProfile, getProfile };