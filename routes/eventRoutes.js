import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Event from "../models/event.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// ✅ Ensure /public/uploads directory exists
const uploadsDir = path.join("public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ Configure multer to store images in /public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Create a New Event (with image upload)
router.post("/create", upload.single("image"), async (req, res) => {
  try {
    const {
      owner,
      title,
      description,
      organizedBy,
      eventDate,
      eventTime,
      location,
      ticketPrice,
    } = req.body;

    if (!title || !eventDate || !eventTime || !location) {
      return res.status(400).json({ error: "Missing required fields: Title, Date, Time, and Location." });
    }

    const image = req.file ? `uploads/${req.file.filename}` : "";

    const newEvent = new Event({
      owner,
      title,
      description,
      organizedBy,
      eventDate,
      eventTime,
      location,
      ticketPrice,
      image,
    });

    await newEvent.save();
    res.status(201).json({ message: "🎉 Event created successfully!", event: newEvent });
  } catch (error) {
    console.error("❌ Error Creating Event:", error);
    res.status(500).json({ error: "Server Error: " + error.message });
  }
});

// ✅ Get All Events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error("❌ Error Fetching Events:", error);
    res.status(500).json({ error: "Server error while fetching events." });
  }
});

// ✅ Get a Single Event by ID
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update an Event (with optional image upload)
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const updatedData = { ...req.body };
    if (req.file) {
      updatedData.image = `uploads/${req.file.filename}`;
    }

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    res.json(updatedEvent);
  } catch (error) {
    console.error("❌ Error Updating Event:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Delete an Event
router.delete("/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Get Analytics for Events Created by Logged-in User
router.get("/analytics/:owner", async (req, res) => {
  try {
    const { owner } = req.params;

    const events = await Event.find({ owner });
    const analytics = [];

    for (const event of events) {
      const bookings = await Booking.find({ eventId: event._id });
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
      const rsvpCount = bookings.length;

      analytics.push({
        eventId: event._id,
        title: event.title,
        rsvpCount,
        totalRevenue,
      });
    }

    res.json(analytics);
  } catch (error) {
    console.error("❌ Error generating analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

export default router;
