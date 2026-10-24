const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const User = require("../models/User");
const { signUser } = require("../utils/token");
const { verifyIdentityDocument } = require("../utils/verifyIdentityDocument");
const safe = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  collegeId: u.collegeId,
  facultyId: u.facultyId,
  mobile: u.mobile,
  vehicleNumber: u.vehicleNumber,
  vehicleType: u.vehicleType,
  identityType: u.identityType,
  identityNumber: u.identityNumber,
  identityVerificationStatus: u.identityVerificationStatus,
});
async function register(req, res, next) {
  try {
    const { name, email, password, role, collegeId, facultyId, mobile, vehicleNumber, vehicleType, identityType, identityNumber } =
      req.body;
    if (!name || !email || !password || !role || !mobile || !vehicleNumber || !vehicleType || !identityType || !identityNumber || !req.file)
      return res
        .status(400)
        .json({
          success: false,
          message: "All registration fields and an identity document are required",
        });
    if (!["student", "faculty"].includes(role))
      return res
        .status(400)
        .json({
          success: false,
          message: "Only Student or Faculty can register",
        });
    if (role === "student" && !collegeId)
      return res
        .status(400)
        .json({
          success: false,
          message: "Enrollment Number / Computer Code is required",
        });
    if (role === "faculty" && !facultyId)
      return res
        .status(400)
        .json({ success: false, message: "Faculty / Employee ID is required" });
    const normalizedMobile = String(mobile).replace(/\D/g, "");
    const normalizedIdentityNumber = identityType === "aadhaar"
      ? String(identityNumber).replace(/\s/g, "")
      : String(identityNumber).trim().toUpperCase();
    if (!/^[6-9]\d{9}$/.test(normalizedMobile))
      return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number" });
    if (!/^[A-Z0-9 -]{4,15}$/i.test(vehicleNumber))
      return res.status(400).json({ success: false, message: "Enter a valid vehicle number" });
    if (identityType === "aadhaar" && !/^\d{12}$/.test(normalizedIdentityNumber))
      return res.status(400).json({ success: false, message: "Aadhaar number must contain 12 digits" });
    if (identityType === "vehicle_registration" && !/^[A-Z0-9 -]{4,15}$/i.test(normalizedIdentityNumber))
      return res.status(400).json({ success: false, message: "Enter a valid vehicle registration ID" });
    const normalized = email.trim().toLowerCase();
    const or = [{ email: normalized }];
    if (role === "student") or.push({ collegeId });
    if (role === "faculty") or.push({ facultyId });
    or.push({ mobile: normalizedMobile }, { identityNumber: normalizedIdentityNumber });
    const existingUser = await User.findOne({ $or: or });
    if (existingUser) {
      const message = existingUser.email === normalized
        ? "An account already exists with this email address"
        : existingUser.mobile === normalizedMobile
          ? "This mobile number is already registered"
          : existingUser.identityNumber === normalizedIdentityNumber
            ? "This Aadhaar / vehicle registration ID is already registered"
        : role === "student"
          ? "This enrollment number / computer code is already registered"
          : "This faculty / employee ID is already registered";
      fs.unlink(req.file.path, () => {});
      return res.status(409).json({ success: false, message });
    }
    // OCR is useful as a best-effort signal, but it must not prevent a valid
    // registration: photographed identity cards frequently produce unreliable
    // text extraction because of glare, blur, language, or masking.
    try {
      await verifyIdentityDocument(req.file.path, identityType, normalizedIdentityNumber, name);
    } catch (error) {
      console.warn("Identity OCR skipped:", error.message);
    }
    const user = await User.create({
      name,
      email: normalized,
      password: await bcrypt.hash(password, 10),
      role,
      collegeId: role === "student" ? collegeId : undefined,
      facultyId: role === "faculty" ? facultyId : undefined,
      mobile: normalizedMobile,
      vehicleNumber,
      vehicleType: vehicleType.toLowerCase(),
      identityType,
      identityNumber: normalizedIdentityNumber,
      identityDocumentPath: req.file.filename,
      identityVerificationStatus: "verified",
    });
    res
      .status(201)
      .json({
        success: true,
        message: "Registration successful",
        token: signUser(user),
        user: safe(user),
      });
  } catch (e) {
    if (e?.code === 11000) {
      const field = Object.keys(e.keyPattern || {})[0];
      const labels = {
        email: "email address",
        collegeId: "enrollment number / computer code",
        facultyId: "faculty / employee ID",
        mobile: "mobile number",
        identityNumber: "Aadhaar / vehicle registration ID",
      };
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(409).json({ success: false, message: `This ${labels[field] || "value"} is already registered` });
    }
    next(e);
  }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.password))
    )
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    res.json({
      success: true,
      message: "Login successful",
      token: signUser(user),
      user: safe(user),
    });
  } catch (e) {
    next(e);
  }
}
async function me(req, res) {
  res.json({ success: true, user: safe(req.user) });
}
async function updateMe(req, res, next) {
  try {
    const { name, mobile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name && { name: name.trim() }), ...(mobile !== undefined && { mobile: mobile.trim() }) },
      { new: true, runValidators: true },
    ).select("-password");
    res.json({ success: true, user: safe(user) });
  } catch (e) {
    next(e);
  }
}
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Current password and a new password of at least 6 characters are required" });
    const user = await User.findById(req.user._id).select("+password");
    if (!(await bcrypt.compare(currentPassword, user.password)))
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    next(e);
  }
}
async function forgotPassword(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const user = email && await User.findOne({ email });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
      user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      // Replace this with an SMTP/email provider in production; never return the token in an API response.
      console.log(`Password reset link for ${user.email}: ${process.env.FRONTEND_URL || "http://localhost:5173"}/forgot-password?token=${token}`);
    }
    res.json({ success: true, message: "If that email is registered, reset instructions have been sent." });
  } catch (e) { next(e); }
}
// Development-friendly verification step used by the in-app recovery flow.
// In production, call this after the user proves email ownership through an
// emailed OTP/link rather than exposing it directly to the browser.
async function verifyResetEmail(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    const user = await User.findOne({ email, isActive: true });
    if (!user) return res.status(404).json({ success: false, message: "No active account was found for this email" });
    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    res.json({ success: true, message: "Email verified. Set your new password.", resetToken: token });
  } catch (e) { next(e); }
}
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: "A valid reset token and a new password of at least 6 characters are required" });
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ success: false, message: "This password-reset link is invalid or has expired" });
    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    await user.save();
    res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (e) { next(e); }
}
module.exports = { register, login, me, updateMe, changePassword, forgotPassword, verifyResetEmail, resetPassword };
