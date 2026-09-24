const cron = require("node-cron");
const Booking = require("../models/Booking");
const notify = require("./notify");
async function release() {
  const rows = await Booking.find({
    status: "booked",
    noShowDeadline: { $lte: new Date() },
  });
  for (const b of rows) {
    b.status = "no_show";
    await b.save();
    await notify(
      b.user,
      "Booking Expired",
      `Booking ${b.bookingId} was released after the 30-minute grace period.`,
      "parking",
    );
  }
  if (rows.length) console.log(`Released ${rows.length} no-show booking(s)`);
}
function start() {
  cron.schedule("* * * * *", () =>
    release().catch((e) => console.error("No-show job:", e.message)),
  );
}
module.exports = { start, release };
