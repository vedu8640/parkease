const jwt = require("jsonwebtoken");
const crypto = require("crypto");
function signUser(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}
function randomToken() {
  return crypto.randomBytes(24).toString("hex");
}
function bookingId(prefix = "PK") {
  return `${prefix}-${Date.now().toString().slice(-7)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}
module.exports = { signUser, randomToken, bookingId };
