const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSlot",
      required: true,
    },
    vehicleType: { type: String, enum: ["car", "bike"], required: true },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "booked",
        "active",
        "completed",
        "cancelled",
        "no_show",
        "expired",
      ],
      default: "booked",
    },
    qrToken: { type: String, required: true, unique: true },
    entryVerifiedAt: { type: Date, default: null },
    parkingStartedAt: { type: Date, default: null },
    parkingEndedAt: { type: Date, default: null },
    noShowDeadline: { type: Date, required: true },
    extensionCount: { type: Number, default: 0 },
    endReminderSentAt: { type: Date, default: null },
    endOverdueReminderSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ slot: 1, startTime: 1, endTime: 1 });
module.exports = mongoose.model("Booking", schema);
