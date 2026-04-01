import cloudinary from "../config/cloudinary.mjs";
import Product from "../schemas/product.schema.mjs";



export const uploadImage = async (req, res ) => {
  try {
    console.log("FILE:", req.file);

    const {title, price, period, location, owner, category, description} = req.body;
    console.log(req.body);
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "lendly_products"

    });
    
    const newProduct =  await Product.create({
        title , price , period , location , owner , category , description , image : result.secure_url
    })
    res.json({
      message: "Upload successful",
      imageUrl: result.secure_url
    });

  } catch (error) {
    res.status(500).send({message : 'Error uploading image' , error : error.message});
    // res.status(500).json({ errorMessage: "Upload failed" });
  }
};