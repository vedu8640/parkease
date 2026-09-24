const Event = require("../models/Event");
const GuestBooking = require("../models/GuestBooking");
const { bookingId, randomToken } = require("../utils/token");
async function list(req, res, next) {
  try {
    res.json({
      success: true,
      events: await Event.find().sort({ startDate: -1 }),
    });
  } catch (e) {
    next(e);
  }
}
async function create(req, res, next) {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      guestParkingEnabled = false,
    } = req.body;
    const event = await Event.create({
      name,
      description,
      startDate,
      endDate,
      guestParkingEnabled,
      status: "draft",
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, event });
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (e) {
    next(e);
  }
}
async function active(req, res, next) {
  try {
    res.json({
      success: true,
      event: await Event.findOne({
        status: "active",
        guestParkingEnabled: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }),
    });
  } catch (e) {
    next(e);
  }
}
async function guestBook(req, res, next) {
  try {
    const { eventId, guestName, email, mobile, vehicleNumber, vehicleType } =
      req.body;
    const event = await Event.findOne({
      _id: eventId,
      status: "active",
      guestParkingEnabled: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
    if (!event)
      return res
        .status(409)
        .json({
          success: false,
          message: "Guest parking is not currently available",
        });
    const g = await GuestBooking.create({
      guestBookingId: bookingId("GP"),
      event: event._id,
      guestName,
      email,
      mobile,
      vehicleNumber,
      vehicleType,
      passToken: randomToken(),
    });
    res.status(201).json({ success: true, guestBooking: g });
  } catch (e) {
    next(e);
  }
}
module.exports = { list, create, update, active, guestBook };
