import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Route imports
import connectDB from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

// Init Express app
const app = express();

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173", // Local development URL
  process.env.CLIENT_ORIGIN, // Frontend deployed URL (e.g., https://yourfrontend.vercel.app)
];

// CORS middleware setup
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from specified origins or from localhost
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies to be sent with requests
  })
);

// Middlewares
app.use(express.json()); // To parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // To parse form data

// Serve static files (images, uploads) from 'public/uploads' folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// API Routes
app.use("/api/auth", authRoutes); // Auth routes (login, register, etc.)
app.use("/api/events", eventRoutes); // Event-related routes
app.use("/api/payment", paymentRoutes); // Payment routes
app.use("/api/bookings", bookingRoutes); // Booking routes

// Graceful Shutdown: Close the MongoDB connection when the server is stopped
process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

// Start the server
const PORT = process.env.PORT || 5001; // Default port is 5001
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
