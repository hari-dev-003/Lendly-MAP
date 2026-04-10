import Message from '../schemas/message.schema.mjs';

export const getMessages = async (req, res) => {
    try {
        const { room } = req.params;
        const messages = await Message.find({ room }).sort({ createdAt: 1 }).limit(100);
        res.status(200).send({ messages });
    } catch (err) {
        res.status(500).send({ message: 'Error fetching messages', error: err.message });
    }
};
