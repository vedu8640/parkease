const Violation = require("../models/Violation");
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
    res.json({
      success: true,
      violations: await Violation.find(q)
        .populate("slot", "slotNumber zone")
        .sort({ createdAt: -1 }),
    });
  } catch (e) {
    next(e);
  }
}
async function update(req, res, next) {
  try {
    const patch = { status: req.body.status };
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
module.exports = { create, list, update };
