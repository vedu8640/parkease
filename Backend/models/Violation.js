const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    vehicleNumber: { type: String, uppercase: true, trim: true },
    issueType: {
      type: String,
      enum: ["wrong_parking", "blocked_slot", "unauthorized_vehicle", "other"],
      required: true,
    },
    description: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "rejected"],
      default: "pending",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true },
);
module.exports = mongoose.model("Violation", schema);
