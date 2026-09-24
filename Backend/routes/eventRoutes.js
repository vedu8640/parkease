const router = require("express").Router();
const c = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/auth");
router.get("/active", c.active);
router.post("/guest-bookings", c.guestBook);
router.get("/", protect, authorize("admin"), c.list);
router.post("/", protect, authorize("admin"), c.create);
router.patch("/:id", protect, authorize("admin"), c.update);
module.exports = router;
