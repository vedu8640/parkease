const Booking = require("../models/Booking");
const { conflict } = require("../utils/availability");
const notify = require("../utils/notify");
async function get(req) {
  return Booking.findOne({ _id: req.params.id, user: req.user._id });
}
async function start(req, res, next) {
  try {
    const b = await get(req);
    if (!b)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    if (b.status !== "booked")
      return res
        .status(400)
        .json({ success: false, message: "Booking cannot be started" });
    if (new Date() > b.noShowDeadline) {
      b.status = "no_show";
      await b.save();
      return res
        .status(400)
        .json({ success: false, message: "30-minute grace period has ended" });
    }
    b.status = "active";
    b.parkingStartedAt = new Date();
    await b.save();
    await notify(
      req.user._id,
      "Parking Started",
      `Parking ${b.bookingId} is now active.`,
      "parking",
    );
    res.json({
      success: true,
      booking: await b.populate("slot", "slotNumber zone vehicleType"),
    });
  } catch (e) {
    next(e);
  }
}
async function end(req, res, next) {
  try {
    const b = await get(req);
    if (!b)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    if (b.status !== "active")
      return res
        .status(400)
        .json({ success: false, message: "Only active parking can be ended" });
    b.status = "completed";
    b.parkingEndedAt = new Date();
    await b.save();
    await notify(
      req.user._id,
      "Parking Ended",
      `Parking ${b.bookingId} has ended.`,
      "parking",
    );
    res.json({ success: true, booking: b });
  } catch (e) {
    next(e);
  }
}
async function extend(req, res, next) {
  try {
    const b = await get(req);
    const end = new Date(req.body.newEndTime);
    if (!b)
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    if (!["booked", "active"].includes(b.status))
      return res
        .status(400)
        .json({ success: false, message: "Booking cannot be extended" });
    if (!(end > b.endTime))
      return res
        .status(400)
        .json({ success: false, message: "New end time must be later" });
    const c = await conflict(b.slot, b.startTime, end, b._id);
    if (c)
      return res
        .status(409)
        .json({
          success: false,
          message: "Extension denied because another booking uses this slot",
          conflict: c,
        });
    b.endTime = end;
    b.extensionCount++;
    await b.save();
    await notify(
      req.user._id,
      "Parking Extended",
      `Booking ${b.bookingId} was extended.`,
      "parking",
    );
    res.json({ success: true, booking: b });
  } catch (e) {
    next(e);
  }
}
async function active(req, res, next) {
  try {
    res.json({
      success: true,
      booking: await Booking.findOne({
        user: req.user._id,
        status: "active",
      }).populate("slot", "slotNumber zone vehicleType"),
    });
  } catch (e) {
    next(e);
  }
}
module.exports = { start, end, extend, active };
