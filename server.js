import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

// Create Express App
const app = express();

// ✅ 1. Set up allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://eventease-frontend-one.vercel.app",
  "https://eventease-frontend-gold.vercel.app",
  "https://eventease-frontend-mhcye4nkq-venkatkarthik-marinenis-projects.vercel.app", // 👈 add this
  process.env.CLIENT_ORIGIN,
];

// ✅ 2. Dynamic CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight support

// ✅ 3. Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 4. Serve static files (uploads/images)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ✅ 5. Connect to MongoDB
import connectDB from "./config/database.js";
connectDB();

// ✅ 6. Import and use Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ 7. Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down server...");
  await mongoose.connection.close();
  process.exit(0);
});

// ✅ 8. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
