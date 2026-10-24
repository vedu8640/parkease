const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    slotNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleType: { type: String, enum: ["car", "bike"], required: true },
    zone: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["available", "disabled"],
      default: "available",
    },
    notes: { type: String, default: "" },
    // Kept separate from reservation availability: this represents a reported
    // physical condition at the bay, not whether the bay can be booked.
    physicalOccupancyStatus: {
      type: String,
      enum: ["unknown", "reported_wrong_parking", "occupied", "clear"],
      default: "unknown",
    },
  },
  { timestamps: true },
);
module.exports = mongoose.model("ParkingSlot", schema);
