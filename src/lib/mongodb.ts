// lib/mongodb.ts

import mongoose from "mongoose";

let isConnected = false; // ✅ لتجنب إعادة الاتصال كل مرة

export const connectToDB = async (): Promise<void> => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("❌ MONGODB_URI is not defined in .env.local");
  }

  if (isConnected) {
    // ✅ اتصال سابق موجود
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: "mydatabase", // ✏ تقدر تغير اسم الداتا بيز هنا
      bufferCommands: false,
    });

    isConnected = true;
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
};