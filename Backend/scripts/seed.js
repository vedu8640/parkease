require("dns").setServers(["8.8.8.8"]);
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const ParkingSlot = require("../models/ParkingSlot");
const zones = [
  "Academic Block",
  "Library",
  "Admin Block",
  "Student Zone",
  "Faculty Zone",
];
(async () => {
  try {
    await connectDB();
    const email = (
      process.env.ADMIN_EMAIL || "admin@parkease.com"
    ).toLowerCase();
    const pass = process.env.ADMIN_PASSWORD || "admin123";
    let admin = await User.findOne({ email });
    if (!admin)
      admin = await User.create({
        name: "Campus Administrator",
        email,
        password: await bcrypt.hash(pass, 10),
        role: "admin",
      });
    else {
      admin.role = "admin";
      admin.password = await bcrypt.hash(pass, 10);
      admin.isActive = true;
      await admin.save();
    }
    const count = await ParkingSlot.countDocuments();
    if (!count) {
      const slots = [];
      for (let i = 1; i <= 30; i++)
        slots.push({
          slotNumber: `C${String(i).padStart(2, "0")}`,
          vehicleType: "car",
          zone: zones[(i - 1) % zones.length],
        });
      for (let i = 1; i <= 60; i++)
        slots.push({
          slotNumber: `B${String(i).padStart(2, "0")}`,
          vehicleType: "bike",
          zone: zones[(i - 1) % zones.length],
        });
      await ParkingSlot.insertMany(slots);
      console.log("90 parking slots seeded");
    }
    console.log("Admin:", email, "password:", pass);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
