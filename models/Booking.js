import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Refers to the User model
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // Refers to the Event model
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "failed"],
      default: "paid", // Defaults to "paid"
    },
    amount: {
      type: Number,
      default: 0, // Allow free events
      min: 0,
    },
    attendees: {
      type: Number,
      default: 1,
      min: 1, // At least 1 attendee
    },
    attendeeName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1, // Ensure name is not empty
    },
    timestamp: {
      type: Date,
      default: Date.now, // Automatically set current time
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

// Prevent duplicate bookings for same user and event
bookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Optional indexes for optimized queries
bookingSchema.index({ userId: 1 });
bookingSchema.index({ eventId: 1 });

// Create the Booking model
const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
