require("dotenv").config();
const dns = require("dns");
// Set MONGO_DNS_SERVER in .env only where an Atlas SRV lookup needs a
// network DNS server instead of an unavailable localhost DNS proxy.
if (process.env.MONGO_DNS_SERVER) dns.setServers([process.env.MONGO_DNS_SERVER]);
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { start } = require("./utils/noShowJob");
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173",
         "https://parkease-sooty.vercel.app",],
    credentials: true,
  }),
);
app.use(express.json());
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "ParkEase API is running" }),
);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/slots", require("./routes/slotRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/sessions", require("./routes/sessionRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/violations", require("./routes/violationRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use((req, res) =>
  res.status(404).json({ success: false, message: "API route not found" }),
);
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.name === "MulterError" || err.message?.includes("Identity document") ? 400 : 500)
    .json({ success: false, message: err.message || "Internal server error" });
});
const port = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(port, () => {
      console.log(`ParkEase backend: http://localhost:${port}`);
      start();
    }),
  )
  .catch((e) => {
    console.error("Startup failed:", e.message);
    process.exit(1);
  });
