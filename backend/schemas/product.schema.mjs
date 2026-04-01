import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    period:{
        type:String,
        required:true
    },
    location:{
        type:String,
        required:true
    },
    owner:{
        type : String,
        required : true
    },
    category:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    }
});

const Product = mongoose.model('Product',productSchema);

export default Product;