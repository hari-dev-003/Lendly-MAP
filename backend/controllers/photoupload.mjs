import cloudinary from '../config/cloudinary.mjs';
import Product from '../schemas/product.schema.mjs';

export const uploadImage = async (req, res) => {
    try {
        const { title, price, period, location, owner, category, description, condition, lat, lng } = req.body;

        const result = await cloudinary.uploader.upload(req.file.path, { folder: 'lendly_products' });

        const newProduct = await Product.create({
            title, price, period, location, owner, category, description,
            condition: condition || 'Good',
            lat: lat ? parseFloat(lat) : null,
            lng: lng ? parseFloat(lng) : null,
            image: result.secure_url,
        });

        res.json({ message: 'Upload successful', imageUrl: result.secure_url, product: newProduct });
    } catch (error) {
        res.status(500).send({ message: 'Error uploading image', error: error.message });
    }
};
