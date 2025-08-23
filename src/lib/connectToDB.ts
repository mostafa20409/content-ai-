// lib/connectToDB.ts
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

let cached = (global as any).mongooseConnection;

if (!cached) {
  cached = (global as any).mongooseConnection = { conn: null, promise: null };
}

export const connectToDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      autoIndex: true,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      serverMonitoringMode: 'auto' as const,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI!, options)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ Failed to connect to MongoDB:", error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
};

// ✅ أضفنا default export عشان أي طريقة استيراد تشتغل
export default connectToDB;