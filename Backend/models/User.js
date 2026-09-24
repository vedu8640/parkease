const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      required: true,
    },
    collegeId: { type: String, trim: true },
    facultyId: { type: String, trim: true },
    mobile: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
schema.index({ collegeId: 1 }, { unique: true, sparse: true });
schema.index({ facultyId: 1 }, { unique: true, sparse: true });
module.exports = mongoose.model("User", schema);
