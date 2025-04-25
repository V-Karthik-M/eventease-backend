import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid",
    },
    amount: {
      type: Number,
      default: 0, // ✅ Allow 0 for free events
      min: 0,
    },
    attendees: {
      type: Number,
      default: 1,
      min: 1,
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ✅ Prevent duplicate bookings for same user and event
bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Optional: for optimized queries
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
