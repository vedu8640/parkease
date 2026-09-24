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
  },
  { timestamps: true },
);
module.exports = mongoose.model("ParkingSlot", schema);
