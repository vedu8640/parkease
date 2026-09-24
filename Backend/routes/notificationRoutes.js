const router = require("express").Router();
const c = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.get("/", c.list);
router.patch("/:id/read", c.read);
router.patch("/read-all", c.readAll);
module.exports = router;
