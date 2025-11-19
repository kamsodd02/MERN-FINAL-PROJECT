const mongoose = require('mongoose');

const connectDB = async () => {
    try {
    // Try local MongoDB first for development
    const localUri = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/mern-questionnaire';
    const atlasUri = process.env.MONGODB_URI;

    let connectionUri = localUri;

    // In production, use Atlas
    if (process.env.NODE_ENV === 'production' && atlasUri) {
      connectionUri = atlasUri;
    }

    console.log(`🔄 Attempting to connect to MongoDB...`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Connection URI: ${connectionUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`); // Hide password in logs

    try {
      await mongoose.connect(connectionUri);
      console.log("✅ MongoDB connected successfully");
    } catch (localError) {
      if (process.env.NODE_ENV === 'development' && atlasUri && localError.message.includes('ECONNREFUSED')) {
        console.log("⚠️  Local MongoDB connection failed, trying MongoDB Atlas...");
        await mongoose.connect(atlasUri);
        console.log("✅ MongoDB Atlas connected successfully");
      } else {
        throw localError;
      }
    }

    const connection = mongoose.connection;

    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

    return connection;
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Health check function
const checkConnection = () => {
  return mongoose.connection.readyState === 1; // 1 = connected
};

// Get connection stats
const getConnectionStats = () => {
  const stats = {
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };

  // Add more stats if available
  if (mongoose.connection.db) {
    stats.database = mongoose.connection.db.databaseName;
  }

  return stats;
};

module.exports = {
  connectDB,
  checkConnection,
  getConnectionStats
};