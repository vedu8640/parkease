const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    guestBookingId: { type: String, unique: true, required: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: { type: String, enum: ["car", "bike"], required: true },
    passToken: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["active", "used", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("GuestBooking", schema);
