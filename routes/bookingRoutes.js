import express from "express";
import Booking from "../models/Booking.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Event from "../models/event.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// ✅ JWT Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    console.error("❌ JWT Error:", err.message);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

// ✅ Helper to Send Booking Email
const sendBookingEmail = async (toEmail, event) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"EventEase Team" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `🎫 Booking Confirmed for "${event.title}"`,
      html: `
        <h3>Your booking for <strong>${event.title}</strong> is confirmed!</h3>
        <p><strong>Date:</strong> ${new Date(event.eventDate).toDateString()}</p>
        <p><strong>Time:</strong> ${event.eventTime}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Price:</strong> $${event.ticketPrice}</p>
        <hr/>
        <p>Thank you for booking with <strong>EventEase</strong>! 🎉</p>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${toEmail}:`, result.response);
  } catch (error) {
    console.error("❌ Email sending error:", error.message);
  }
};

// ✅ Create Booking (Free or Paid)
router.post("/create", authenticate, async (req, res) => {
  try {
    const {
      eventId,
      amount = 0,
      attendeeName = "Guest",
      attendees = 1,
    } = req.body;

    if (!eventId) {
      return res.status(400).json({ error: "Missing eventId" });
    }

    const existingBooking = await Booking.findOne({
      userId: req.user.id,
      eventId,
    });

    if (existingBooking) {
      return res.status(409).json({ message: "Booking already exists for this event." });
    }

    const booking = await Booking.create({
      userId: req.user.id,
      eventId,
      amount,
      attendeeName,
      attendees,
    });

    const user = await User.findById(req.user.id);
    const event = await Event.findById(eventId);

    if (user?.email && event) {
      await sendBookingEmail(user.email, event);
    }

    res.status(201).json({
      message: "🎉 Booking created successfully and confirmation email sent.",
      booking,
    });
  } catch (err) {
    console.error("❌ Booking creation failed:", err);
    res.status(500).json({ error: "Server error: Failed to create booking" });
  }
});

// ✅ Get Logged-in User’s Bookings
router.get("/my-bookings", authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).populate("eventId");

    const unique = new Map();
    const deduplicated = bookings.filter((b) => {
      const key = b.eventId?._id?.toString();
      if (!key || unique.has(key)) return false;
      unique.set(key, true);
      return true;
    });

    res.json(deduplicated);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: "Server error while fetching bookings", error: err.message });
  }
});

// ✅ Cancel Booking
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const deleted = await Booking.findOneAndDelete({
      _id: bookingId,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Booking not found or unauthorized" });
    }

    res.json({ message: "✅ Booking cancelled successfully." });
  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    res.status(500).json({ message: "Server error while cancelling booking", error: err.message });
  }
});

export default router;
