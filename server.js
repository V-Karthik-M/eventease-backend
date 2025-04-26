import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

dotenv.config();

// ✅ 1. Create Express App
const app = express();

// ✅ 2. Set up allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://eventease-frontend-one.vercel.app",
  "https://eventease-frontend-gold.vercel.app",
  "https://eventease-frontend-mhcye4nkq-venkatkarthik-marinenis-projects.vercel.app",
  process.env.CLIENT_ORIGIN,
];

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

// ✅ 3. Handle Preflight OPTIONS requests properly
app.options("*", cors(corsOptions));

// ✅ 4. Middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 5. Serve static uploads/images
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ✅ 6. MongoDB connection
import connectDB from "./config/database.js";
connectDB();

// ✅ 7. API Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookings", bookingRoutes);

// ✅ 8. Graceful Shutdown (good practice)
process.on("SIGINT", async () => {
  console.log("🛑 Gracefully shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

// ✅ 9. Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running at port ${PORT}`);
});
