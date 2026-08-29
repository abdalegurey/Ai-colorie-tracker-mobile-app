import mongoose from "mongoose";
import { config } from "./config.js";

let isConnected = false;

export const isDbConnected = (): boolean =>
  isConnected && mongoose.connection.readyState === 1;

const getMongoUri = (): string => {
  const uri =
    config.mongodbUri ||
    process.env.MONGODB_URI_DEV ||
    process.env.MONGODB_URI ||
    process.env.MONGODB_URI_PROD;

  if (!uri) {
    throw new Error(
      "MongoDB URI is not defined. Set MONGODB_URI_DEV in backend/.env"
    );
  }

  return uri;
};

const connectOnce = async (): Promise<void> => {
  const mongoURI = getMongoUri();

  await mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  });

  isConnected = true;
  console.log(`Connected to MongoDB: ${mongoose.connection.host}`);
};

const connectDB = async (retries = 3, delayMs = 5000): Promise<void> => {
  mongoose.connection.on("connected", () => {
    isConnected = true;
  });

  mongoose.connection.on("disconnected", () => {
    isConnected = false;
    console.warn("MongoDB disconnected. Retrying connection...");
    void reconnectWithRetry(retries, delayMs);
  });

  await reconnectWithRetry(retries, delayMs);
};

const reconnectWithRetry = async (
  retries: number,
  delayMs: number
): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => undefined);
      }

      await connectOnce();
      return;
    } catch (error) {
      isConnected = false;
      const message =
        error instanceof Error ? error.message : "Unknown MongoDB error";

      console.error(
        `MongoDB connection attempt ${attempt}/${retries} failed: ${message}`
      );

      if (attempt === retries) {
        console.error(
          "Could not connect to MongoDB. Check Atlas IP whitelist (Network Access) and your internet connection."
        );
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
};

export default connectDB;
