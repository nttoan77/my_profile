import mongoose from 'mongoose';

async function connect() {
    try {
        await mongoose.connect('mongodb://localhost:27017/my_cv_data');
        console.log('Connect successfully!');
    } catch (error) {
        console.error('Connect failure!', error.message); 
    }
}

export default {connect};

