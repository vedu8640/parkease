const User = require("../models/User");
const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const Violation = require("../models/Violation");

async function dashboard(req, res, next) {
  try {
    const total = await ParkingSlot.countDocuments();
    const enabledSlots = await ParkingSlot.countDocuments({ status: "available" });

    const active = await Booking.countDocuments({
      status: "active",
    });

    const now = new Date();

    const booked = await Booking.countDocuments({
      status: "booked",
      startTime: { $lte: now },
      endTime: { $gt: now },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const today = await Booking.countDocuments({
      createdAt: { $gte: todayStart },
    });

    // Count today's no-show bookings
    const noShow = await Booking.countDocuments({
      status: "no_show",
      createdAt: { $gte: todayStart },
    });

    res.json({
      success: true,
      stats: {
        totalSlots: total,

        // Active + currently booked slots are not available
        availableSlots: Math.max(0, enabledSlots - active - booked),

        bookedSlots: booked,
        occupiedSlots: active,
        todayBookings: today,

        // Today's no-show count
        noShowExpired: noShow,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function bookings(req, res, next) {
  try {
    res.json({
      success: true,
      bookings: await Booking.find()
        .populate("user", "name email role collegeId")
        .populate("slot", "slotNumber zone vehicleType")
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    next(e);
  }
}

async function users(req, res, next) {
  try {
    res.json({
      success: true,
      users: await User.find()
        .select("-password")
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    next(e);
  }
}

async function reports(req, res, next) {
  try {
    const [status, vehicle, slots] = await Promise.all([
      Booking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      Booking.aggregate([
        {
          $group: {
            _id: "$vehicleType",
            count: { $sum: 1 },
          },
        },
      ]),

      ParkingSlot.aggregate([
        {
          $group: {
            _id: "$vehicleType",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      reports: {
        bookingsByStatus: status,
        bookingsByVehicle: vehicle,
        slotsByType: slots,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function violations(req, res, next) {
  try {
    res.json({
      success: true,
      violations: await Violation.find()
        .populate("reportedBy", "name email")
        .populate("slot", "slotNumber zone")
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  dashboard,
  bookings,
  users,
  reports,
  violations,
};
