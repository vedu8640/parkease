const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    complaintId: { type: String, unique: true, sparse: true },
    reporterBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    occupantBooking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    alternativeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    occupantAlternativeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    occupantOriginalSlot: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingSlot" },
    transferStatus: {
      type: String,
      enum: ["not_started", "transferred", "pending_admin"],
      default: "not_started",
    },
    adminAction: { type: String, default: "" },
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
      enum: ["pending", "alternative_offered", "pending_admin", "reviewed", "resolved", "rejected"],
      default: "pending",
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: Date,
  },
  { timestamps: true },
);
schema.index({ reportedBy: 1, reporterBooking: 1, status: 1 });
module.exports = mongoose.model("Violation", schema);
