const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signUser } = require("../utils/token");
const safe = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  collegeId: u.collegeId,
  facultyId: u.facultyId,
  mobile: u.mobile,
});
async function register(req, res, next) {
  try {
    const { name, email, password, role, collegeId, facultyId, mobile } =
      req.body;
    if (!name || !email || !password || !role)
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, email, password and role are required",
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
    const normalized = email.trim().toLowerCase();
    const or = [{ email: normalized }];
    if (role === "student") or.push({ collegeId });
    if (role === "faculty") or.push({ facultyId });
    if (await User.findOne({ $or: or }))
      return res
        .status(409)
        .json({ success: false, message: "Account already exists" });
    const user = await User.create({
      name,
      email: normalized,
      password: await bcrypt.hash(password, 10),
      role,
      collegeId: role === "student" ? collegeId : undefined,
      facultyId: role === "faculty" ? facultyId : undefined,
      mobile,
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
  res.json({ success: true, user: req.user });
}
module.exports = { register, login, me };
