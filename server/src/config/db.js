const mongoose = require('mongoose');

// Without this, Mongoose buffers queries indefinitely when the DB is
// unreachable and requests hang instead of erroring. Fail fast so the
// client gets a real 500 and the container healthcheck can react.
mongoose.set('bufferTimeoutMS', 5000);

/**
 * Establishes the MongoDB connection using Mongoose.
 * Exits the process on failure so container orchestration (Docker/K8s)
 * can restart the service rather than run in a broken half-connected state.
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/istidamah';
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`[db] MongoDB connected -> ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`[db] Connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
