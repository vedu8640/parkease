const Notification = require("../models/Notification");
async function notify(
  user,
  title,
  message,
  type = "system",
  link = "",
) {
  return Notification.create({
    user,
    title,
    message,
    type,
    link,
  });
}
module.exports = notify;
