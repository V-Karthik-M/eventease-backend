import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();

// ✅ Real Allow Origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://eventease-frontend-one.vercel.app",
  "https://eventease-frontend-gold.vercel.app",
  "https://eventease-frontend-mhcye4nkq-venkatkarthik-marinenis-projects.vercel.app",
  "https://eventease-frontend-d9eqd1pgp-venkatkarthik-marinenis-projects.vercel.app", // << add this one
  process.env.CLIENT_ORIGIN,
];

// ✅ Dynamic CORS Handler
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // Preflight success
  }
  next();
});

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ✅ MongoDB Connect
import connectDB from "./config/database.js";
connectDB();

// ✅ Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down server...");
  await mongoose.connection.close();
  process.exit(0);
});

// ✅ Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
