import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseGlobal: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseGlobal || {
  conn: null,
  promise: null,
};

if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

export const connectToDB = async () => {
  if (cached.conn) {
    // تحقق أن الاتصال لا يزال نشطاً
    if (cached.conn.connection.readyState === 1) {
      return cached.conn;
    } else {
      // إعادة الاتصال إذا كان مغلقاً
      console.log("🔄 إعادة الاتصال بقاعدة البيانات...");
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    const options = {
      bufferCommands: false,
      autoIndex: process.env.NODE_ENV === 'development',
      connectTimeoutMS: 10000, // تقليل الوقت
      serverSelectionTimeoutMS: 10000, // تقليل الوقت
      socketTimeoutMS: 20000, // تقليل الوقت
      maxPoolSize: 5, // تقليل حجم pool
      minPoolSize: 1,
      maxIdleTimeMS: 10000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, options)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance;
      })
      .catch((error) => {
        console.error("❌ Failed to connect to MongoDB:", error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }

  return cached.conn;
};

export default connectToDB;