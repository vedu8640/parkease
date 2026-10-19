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
async function sendParkingEndReminders() {
  const now = new Date();
  const tenMinutesFromNow = new Date(now.getTime() + 10 * 60000);
  const endingSoon = await Booking.find({
    status: "active",
    endTime: { $gt: now, $lte: tenMinutesFromNow },
    endReminderSentAt: null,
  });
  for (const booking of endingSoon) {
    booking.endReminderSentAt = now;
    await booking.save();
    await notify(
      booking.user,
      "Parking ends in 10 minutes",
      `Parking ${booking.bookingId} ends at ${booking.endTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}. You can extend it if the slot is still available.`,
      "reminder",
      "/active-parking",
    );
  }

  const overdue = await Booking.find({
    status: "active",
    endTime: { $lte: now },
    endOverdueReminderSentAt: null,
  });
  for (const booking of overdue) {
    booking.endOverdueReminderSentAt = now;
    await booking.save();
    await notify(
      booking.user,
      "Please end your parking session",
      `Parking ${booking.bookingId} has reached its end time. Please end the session now.`,
      "reminder",
      "/active-parking",
    );
  }
}
function start() {
  cron.schedule("* * * * *", () =>
    Promise.all([release(), sendParkingEndReminders()]).catch((e) =>
      console.error("Parking notification job:", e.message),
    ),
  );
}
module.exports = { start, release, sendParkingEndReminders };
