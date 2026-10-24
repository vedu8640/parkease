const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads", "identities");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, callback) =>
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ["image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype))
      return callback(new Error("Identity document must be a clear JPG or PNG image"));
    callback(null, true);
  },
});

module.exports = upload;
