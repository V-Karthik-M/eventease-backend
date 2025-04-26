import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

// Create Express App
const app = express();

// ✅ 1. Correct CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      // Allow server-to-server or Postman requests (no origin)
      return callback(null, true);
    }
    if (
      origin.includes("vercel.app") || // Allow any Vercel deployment
      origin.includes("localhost")     // Allow localhost (for development)
    ) {
      return callback(null, true);
    }
    console.log("❌ Blocked by CORS:", origin);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight OPTIONS

// ✅ 2. Middleware for JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 3. Serve static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ✅ 4. Connect to MongoDB
import connectDB from "./config/database.js";
connectDB();

// ✅ 5. Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ 6. Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down server...");
  await mongoose.connection.close();
  process.exit(0);
});

// ✅ 7. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
