import dotenv from "dotenv";

import express, {  Request, Response, NextFunction } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
;
import authRoutes from "./routes/auth.js";

import foodRoutes from "./routes/food.js";
import reportsRoutes from "./routes/reports.js";


dotenv.config();


const app = express();


connectDB();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes

app.use("/api/auth", authRoutes);

app.use("/api/food", foodRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to colorie trucker API",
    version: "1.0.0",
    status: "success",
    timestamp: new Date().toISOString(),
  });
});


// error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

// 404 middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT =  process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});