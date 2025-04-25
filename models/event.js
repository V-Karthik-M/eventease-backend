import mongoose from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    organizedBy: {
      type: String,
      default: "Event Organizer",
      trim: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
    eventTime: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0, // ✅ No negative prices
    },
    image: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", EventSchema);
