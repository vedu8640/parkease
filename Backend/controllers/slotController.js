const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
async function list(req, res, next) {
  try {
    const { vehicleType, zone, startTime, endTime } = req.query;
    const filter = {};
    // Administrators manage every slot. Users should only receive slots that
    // are enabled by an administrator, so unavailable slots never appear in
    // their parking selection.
    if (req.user.role !== "admin") filter.status = "available";
    if (vehicleType) filter.vehicleType = vehicleType;
    if (zone) filter.zone = zone;
    const slots = await ParkingSlot.find(filter)
      .sort({ vehicleType: 1, slotNumber: 1 })
      .lean();
    if (!startTime || !endTime)
      return res.json({
        success: true,
        slots: slots.map((s) => ({
          ...s,
          availabilityStatus:
            s.status === "disabled" ? "disabled" : "available",
        })),
      });
    const start = new Date(startTime),
      end = new Date(endTime);
    if (!(start < end))
      return res
        .status(400)
        .json({ success: false, message: "Invalid time range" });
    const busy = await Booking.find({
      status: { $in: ["booked", "active"] },
      startTime: { $lt: end },
      endTime: { $gt: start },
    }).select("slot status");
    const map = new Map(busy.map((b) => [String(b.slot), b.status]));
    res.json({
      success: true,
      slots: slots.map((s) => ({
        ...s,
        availabilityStatus:
          s.status === "disabled"
            ? "disabled"
            : map.has(String(s._id))
              ? map.get(String(s._id)) === "active"
                ? "occupied"
                : "booked"
              : "available",
      })),
    });
  } catch (e) {
    next(e);
  }
}
async function create(req, res, next) {
  try {
    const { slotNumber, vehicleType, zone, notes } = req.body;
    if (!slotNumber || !vehicleType || !zone)
      return res
        .status(400)
        .json({
          success: false,
          message: "slotNumber, vehicleType and zone are required",
        });
    res
      .status(201)
      .json({
        success: true,
        slot: await ParkingSlot.create({
          slotNumber,
          vehicleType,
          zone,
          notes,
        }),
      });
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!slot)
      return res
        .status(404)
        .json({ success: false, message: "Slot not found" });
    res.json({ success: true, slot });
  } catch (e) {
    next(e);
  }
}
async function remove(req, res, next) {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot)
      return res
        .status(404)
        .json({ success: false, message: "Slot not found" });
    const active = await Booking.findOne({
      slot: slot._id,
      status: { $in: ["booked", "active"] },
      endTime: { $gt: new Date() },
    });
    if (active)
      return res
        .status(409)
        .json({
          success: false,
          message: "Cannot delete a slot with an active/upcoming booking",
        });
    await slot.deleteOne();
    res.json({ success: true, message: "Slot deleted" });
  } catch (e) {
    next(e);
  }
}
module.exports = { list, create, update, remove };
