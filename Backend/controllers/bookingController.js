const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const { bookingId, randomToken } = require("../utils/token");
const { conflict } = require("../utils/availability");
const notify = require("../utils/notify");

const populate = (q) =>
  q
    .populate("slot", "slotNumber zone vehicleType")
    .populate("user", "name email role collegeId facultyId");

async function create(req, res, next) {
  try {
    const {
      slotId,
      vehicleType,
      vehicleNumber,
      startTime,
      endTime,
    } = req.body;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      !slotId ||
      !vehicleType ||
      !vehicleNumber ||
      isNaN(start) ||
      isNaN(end)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "slotId, vehicleType, vehicleNumber, startTime and endTime are required",
      });
    }

    if (start >= end || start < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking time",
      });
    }

    const slot = await ParkingSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Slot not found",
      });
    }

    if (slot.status === "disabled") {
      return res.status(409).json({
        success: false,
        message: "Slot is unavailable",
      });
    }

    if (slot.vehicleType !== vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Vehicle type does not match slot",
      });
    }

    const c = await conflict(slot._id, start, end);

    if (c) {
      return res.status(409).json({
        success: false,
        message: "Slot is already booked for this time",
        conflict: c,
      });
    }

    const booking = await Booking.create({
      bookingId: bookingId(),
      user: req.user._id,
      slot: slot._id,
      vehicleType,
      vehicleNumber,
      startTime: start,
      endTime: end,
      qrToken: randomToken(),
      noShowDeadline: new Date(start.getTime() + 30 * 60000),
    });

    const out = await populate(
      Booking.findById(booking._id),
    );

    res.status(201).json({
      success: true,
      booking: out,
    });
  } catch (e) {
    next(e);
  }
}

async function mine(req, res, next) {
  try {
    res.json({
      success: true,
      bookings: await populate(
        Booking.find({ user: req.user._id }).sort({
          startTime: -1,
        }),
      ),
    });
  } catch (e) {
    next(e);
  }
}

async function one(req, res, next) {
  try {
    const q =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : {
            _id: req.params.id,
            user: req.user._id,
          };

    const b = await populate(Booking.findOne(q));

    if (!b) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      booking: b,
    });
  } catch (e) {
    next(e);
  }
}

async function cancel(req, res, next) {
  try {
    const b = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!b) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (b.status !== "booked") {
      return res.status(400).json({
        success: false,
        message: "Only booked reservations can be cancelled",
      });
    }

    b.status = "cancelled";
    await b.save();

    await notify(
      req.user._id,
      "Booking Cancelled",
      `Booking ${b.bookingId} has been cancelled.`,
      "booking",
      `/booking/${b.bookingId}`,
    );

    res.json({
      success: true,
      booking: b,
    });
  } catch (e) {
    next(e);
  }
}

async function verify(req, res, next) {
  try {
    const { qrToken } = req.body;

    const b = await populate(
      Booking.findOne({ qrToken }),
    );

    if (!b) {
      return res.status(404).json({
        success: false,
        approved: false,
        message: "Invalid QR / booking not found",
      });
    }

    const now = new Date();

    if (b.status !== "booked") {
      return res.status(409).json({
        success: false,
        approved: false,
        message: `Entry denied: booking is ${b.status}`,
      });
    }

    if (now > b.noShowDeadline) {
      b.status = "no_show";
      await b.save();

      return res.status(409).json({
        success: false,
        approved: false,
        message: "Booking expired after 30-minute grace period",
      });
    }

    if (
      now <
      new Date(b.startTime.getTime() - 30 * 60000)
    ) {
      return res.status(409).json({
        success: false,
        approved: false,
        message: "Entry is not open yet",
      });
    }

    if (now > b.endTime) {
      return res.status(409).json({
        success: false,
        approved: false,
        message: "Booking time has ended",
      });
    }

    b.entryVerifiedAt = now;
    await b.save();

    res.json({
      success: true,
      approved: true,
      message: "Entry approved",
      booking: b,
    });
  } catch (e) {
    next(e);
  }
}

async function verifyGateEntry(req, res, next) {
  try {
    const { gateToken } = req.body;

    // Fixed ParkEase Gate QR token
    if (
      gateToken !==
      process.env.PARKEASE_GATE_TOKEN
    ) {
      return res.status(403).json({
        success: false,
        approved: false,
        message: "Invalid ParkEase Gate QR",
      });
    }

    const now = new Date();

    // Find user's valid current booking
    const b = await populate(
      Booking.findOne({
        user: req.user._id,
        status: "booked",
        startTime: { $lte: now },
        endTime: { $gt: now },
      }).sort({
        startTime: 1,
      }),
    );

    if (!b) {
      return res.status(404).json({
        success: false,
        approved: false,
        message:
          "No valid parking booking found for your account",
      });
    }

    // 30-minute grace period expired
    if (now > b.noShowDeadline) {
      b.status = "no_show";
      await b.save();

      return res.status(409).json({
        success: false,
        approved: false,
        message:
          "Booking expired after 30-minute grace period",
      });
    }

    // Mark entry as verified
    b.entryVerifiedAt = now;
    await b.save();

    return res.json({
      success: true,
      approved: true,
      message: "Entry approved",
      booking: b,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  create,
  mine,
  one,
  cancel,
  verify,
  verifyGateEntry,
};