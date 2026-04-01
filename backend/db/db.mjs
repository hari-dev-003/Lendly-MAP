import mongoose from 'mongoose';

const connection = mongoose.connect('mongodb+srv://Badri:Badri@finquest.pp84x.mongodb.net/lendly')
.then(()=>{
    console.log('DB Connected Successfully');
})
.catch((err)=>{
    console.log('DB Connection Failed',err);
})

export default connection;