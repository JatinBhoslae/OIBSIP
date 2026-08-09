import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pizzahub';

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });

    // Log connection host without exposing full URI (which may contain credentials)
    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      database: conn.connection.name,
    });
  } catch (error) {
    logger.error('Database Connection Error', { error: error.message });
    process.exit(1);
  }
};

export default connectDB;
