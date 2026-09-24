require("dotenv").config();

const QRCode = require("qrcode");

const gateToken = process.env.PARKEASE_GATE_TOKEN;

if (!gateToken) {
  console.error("PARKEASE_GATE_TOKEN is missing in .env");
  process.exit(1);
}

QRCode.toFile(
  "parkease-gate-qr.png",
  gateToken,
  {
    width: 500,
    margin: 2,
  },
  (err) => {
    if (err) {
      console.error("Failed to generate Gate QR:", err);
      process.exit(1);
    }

    console.log("ParkEase Gate QR generated successfully.");
  }
);