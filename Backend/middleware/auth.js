const jwt = require("jsonwebtoken");
const User = require("../models/User");
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer "))
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user || !user.isActive)
      return res
        .status(401)
        .json({ success: false, message: "Invalid or inactive account" });
    req.user = user;
    next();
  } catch (e) {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
}
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    next();
  };
module.exports = { protect, authorize };
