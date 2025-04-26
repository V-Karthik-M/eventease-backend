import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

// Create Express App
const app = express();

// ✅ 1. Handle OPTIONS requests manually (important for CORS preflight)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(204); // Empty successful response for OPTIONS
  }
  next();
});

// ✅ 2. Set up CORS properly
const allowedOrigins = [
  "http://localhost:5173",
  "https://eventease-frontend-one.vercel.app",
  "https://eventease-frontend-gold.vercel.app",
  process.env.CLIENT_ORIGIN,
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

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

// ✅ 7. Graceful Shutdown (optional but professional)
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
