const Booking = require("../models/Booking");
async function conflict(slot, start, end, excludeId) {
  const q = {
    slot,
    status: { $in: ["booked", "active"] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Booking.findOne(q).select("bookingId startTime endTime status");
}
module.exports = { conflict };
