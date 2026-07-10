import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const connectDB = async () => {
  const mongoURI =
    process.env.MONGODB_URI ||
    "mongodb+srv://elibrary206_db_user:elibrary2026@elibrary.tqvpocr.mongodb.net/?appName=elibrary";
  if (!mongoURI) {
    console.error("MONGODB_URI is not set");
    return null;
  }

  try {
    if (mongoose.connection.readyState === 1) {
      console.log("MongoDB already connected");
      return mongoose.connection;
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
      retryWrites: true,
      tls: true,
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`,
    );
    return conn.connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    return null;
  }
};

export default connectDB;
