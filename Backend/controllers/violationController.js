const Violation = require("../models/Violation");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const User = require("../models/User");
const { conflict } = require("../utils/availability");
const notify = require("../utils/notify");

const ACTIVE_BOOKING_STATUSES = ["booked", "active"];
const complaintId = () => `WPC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
const populateComplaint = (query) => query
  .populate("reportedBy", "name email collegeId facultyId")
  .populate({ path: "slot", select: "slotNumber vehicleType physicalOccupancyStatus" })
  .populate({ path: "alternativeSlot", select: "slotNumber vehicleType" })
  .populate({ path: "occupantAlternativeSlot", select: "slotNumber vehicleType" })
  .populate({ path: "occupantOriginalSlot", select: "slotNumber vehicleType" })
  .populate({ path: "reporterBooking", populate: { path: "slot", select: "slotNumber vehicleType" } })
  .populate({ path: "occupantBooking", populate: [{ path: "slot", select: "slotNumber vehicleType" }, { path: "user", select: "name email collegeId facultyId" }] });

async function findAlternative(booking, excludedSlotId) {
  const candidates = await ParkingSlot.find({
    vehicleType: booking.vehicleType,
    status: "available",
    _id: { $ne: excludedSlotId },
  }).sort({ slotNumber: 1 });
  for (const candidate of candidates) {
    const existing = await conflict(candidate._id, booking.startTime, booking.endTime, booking._id);
    if (!existing) return candidate;
  }
  return null;
}

async function notifyAdmins(title, message, link) {
  const admins = await User.find({ role: "admin", isActive: true }).select("_id");
  await Promise.all(admins.map((admin) => notify(admin._id, title, message, "violation", link)));
}

async function wrongParking(req, res, next) {
  try {
    const { reporterBookingId, vehicleNumber, description = "" } = req.body;
    if (!reporterBookingId || !vehicleNumber)
      return res.status(400).json({ success: false, message: "Select your booking and enter the vehicle number occupying your slot." });

    const reporterBooking = await Booking.findOne({
      _id: reporterBookingId,
      user: req.user._id,
      status: { $in: ACTIVE_BOOKING_STATUSES },
    });
    if (!reporterBooking)
      return res.status(400).json({ success: false, message: "Only an active or valid booking can be used for a wrong-parking complaint." });

    const openComplaint = await Violation.findOne({
      reporterBooking: reporterBooking._id,
      status: { $in: ["pending", "alternative_offered", "pending_admin", "reviewed"] },
    });
    if (openComplaint)
      return res.status(409).json({ success: false, message: "A complaint for this booking is already open." });

    const normalizedVehicle = vehicleNumber.trim().toUpperCase();
    const occupantBooking = await Booking.findOne({
      vehicleNumber: normalizedVehicle,
      _id: { $ne: reporterBooking._id },
      status: { $in: ACTIVE_BOOKING_STATUSES },
      startTime: { $lt: reporterBooking.endTime },
      endTime: { $gt: reporterBooking.startTime },
    });
    if (!occupantBooking)
      return res.status(404).json({ success: false, message: "No valid overlapping booking was found for this vehicle. The complaint was not created." });
    if (String(occupantBooking.slot) === String(reporterBooking.slot))
      return res.status(400).json({ success: false, message: "This vehicle is already assigned to your slot." });

    const alternative = await findAlternative(reporterBooking, reporterBooking.slot);
    const complaint = await Violation.create({
      complaintId: complaintId(),
      reportedBy: req.user._id,
      reporterBooking: reporterBooking._id,
      occupantBooking: occupantBooking._id,
      occupantOriginalSlot: occupantBooking.slot,
      slot: reporterBooking.slot,
      alternativeSlot: alternative?._id,
      vehicleNumber: normalizedVehicle,
      issueType: "wrong_parking",
      description,
      status: alternative ? "alternative_offered" : "pending_admin",
      transferStatus: alternative ? "not_started" : "pending_admin",
    });
    await ParkingSlot.findByIdAndUpdate(reporterBooking.slot, { physicalOccupancyStatus: "reported_wrong_parking" });
    if (!alternative) await notifyAdmins("Wrong parking needs an alternate slot", `Complaint ${complaint.complaintId} has no available alternative slot.`, `/admin/complaints`);
    res.status(201).json({ success: true, complaint: await populateComplaint(Violation.findById(complaint._id)) });
  } catch (e) { next(e); }
}

async function acceptAlternative(req, res, next) {
  try {
    const complaint = await Violation.findOne({ _id: req.params.id, reportedBy: req.user._id });
    if (!complaint || complaint.issueType !== "wrong_parking") return res.status(404).json({ success: false, message: "Complaint not found." });
    if (complaint.status !== "alternative_offered") return res.status(409).json({ success: false, message: "This complaint has no pending alternative to accept." });
    const reporterBooking = await Booking.findById(complaint.reporterBooking);
    const occupantBooking = await Booking.findById(complaint.occupantBooking);
    if (!reporterBooking || !occupantBooking || !ACTIVE_BOOKING_STATUSES.includes(reporterBooking.status) || !ACTIVE_BOOKING_STATUSES.includes(occupantBooking.status))
      return res.status(409).json({ success: false, message: "The involved booking is no longer eligible for reassignment." });

    let alternative = await ParkingSlot.findById(complaint.alternativeSlot);
    if (!alternative || alternative.status !== "available" || await conflict(alternative._id, reporterBooking.startTime, reporterBooking.endTime, reporterBooking._id))
      alternative = await findAlternative(reporterBooking, complaint.slot);
    if (!alternative) {
      complaint.status = "pending_admin"; complaint.transferStatus = "pending_admin"; await complaint.save();
      await notifyAdmins("Wrong parking complaint pending", `Complaint ${complaint.complaintId} needs a manual alternate-slot decision.`, `/admin/complaints`);
      return res.status(409).json({ success: false, message: "The suggested alternative is no longer available. An administrator has been alerted." });
    }

    // Reassign instead of cancelling/recreating the booking so a verified gate
    // entry remains valid and the user never needs a second QR scan.
    reporterBooking.slot = alternative._id;
    await reporterBooking.save();
    complaint.alternativeSlot = alternative._id;
    const targetConflict = await conflict(complaint.slot, occupantBooking.startTime, occupantBooking.endTime, occupantBooking._id);
    if (!targetConflict) {
      occupantBooking.slot = complaint.slot;
      await occupantBooking.save();
      complaint.transferStatus = "transferred";
      complaint.status = "resolved";
      complaint.adminAction = "Automatically reassigned both bookings after availability checks.";
      await ParkingSlot.findByIdAndUpdate(complaint.slot, { physicalOccupancyStatus: "occupied" });
      await notify(occupantBooking.user, "Parking slot updated", `Your booking ${occupantBooking.bookingId} has been moved to the correct slot after a wrong-parking complaint.`, "violation", `/booking/${occupantBooking._id}`);
    } else {
      const occupantAlternative = await findAlternative(occupantBooking, complaint.slot);
      complaint.occupantAlternativeSlot = occupantAlternative?._id;
      complaint.transferStatus = "pending_admin";
      complaint.status = "pending_admin";
      complaint.adminAction = occupantAlternative
        ? `Correct slot has an overlapping booking. Suggested alternate for involved vehicle: ${occupantAlternative.slotNumber}; administrator confirmation required.`
        : "Correct slot has an overlapping booking and no suitable alternate was available; administrator action required.";
      await notify(occupantBooking.user, "Wrong parking reported", occupantAlternative
        ? `Please move your vehicle as instructed by parking administration. A suitable alternate slot (${occupantAlternative.slotNumber}) has been suggested for administrator confirmation.`
        : "Please move your vehicle as instructed by parking administration. Your booking slot needs manual reassignment.", "violation", `/booking/${occupantBooking._id}`);
      await notifyAdmins("Wrong parking requires action", `Complaint ${complaint.complaintId} needs manual handling because the correct slot has an overlapping booking.`, `/admin/complaints`);
    }
    await complaint.save();
    await notify(req.user._id, "Alternative slot assigned", `Your booking ${reporterBooking.bookingId} has been reassigned to ${alternative.slotNumber}. Your entry verification remains valid.`, "violation", `/booking/${reporterBooking._id}`);
    res.json({ success: true, complaint: await populateComplaint(Violation.findById(complaint._id)) });
  } catch (e) { next(e); }
}
async function create(req, res, next) {
  try {
    const v = await Violation.create({ ...req.body, reportedBy: req.user._id });
    res.status(201).json({ success: true, violation: v });
  } catch (e) {
    next(e);
  }
}
async function list(req, res, next) {
  try {
    const q = req.user.role === "admin" ? {} : { reportedBy: req.user._id };
    res.json({ success: true, violations: await populateComplaint(Violation.find(q).sort({ createdAt: -1 })) });
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const patch = { status: req.body.status, adminAction: req.body.adminAction || "" };
    if (req.body.status === "resolved") {
      patch.resolvedBy = req.user._id;
      patch.resolvedAt = new Date();
    }
    const v = await Violation.findByIdAndUpdate(req.params.id, patch, {
      new: true,
    });
    if (!v)
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    res.json({ success: true, violation: v });
  } catch (e) {
    next(e);
  }
}
module.exports = { create, list, update, wrongParking, acceptAlternative };
