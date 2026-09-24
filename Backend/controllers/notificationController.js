const Notification = require("../models/Notification");
async function list(req, res, next) {
  try {
    res.json({
      success: true,
      notifications: await Notification.find({ user: req.user._id }).sort({
        createdAt: -1,
      }),
    });
  } catch (e) {
    next(e);
  }
}
async function read(req, res, next) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true },
    );
    if (!n)
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    res.json({ success: true, notification: n });
  } catch (e) {
    next(e);
  }
}
async function readAll(req, res, next) {
  try {
    await Notification.updateMany({ user: req.user._id }, { isRead: true });
    res.json({ success: true, message: "Notifications marked as read" });
  } catch (e) {
    next(e);
  }
}
module.exports = { list, read, readAll };
