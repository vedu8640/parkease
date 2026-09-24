const router = require("express").Router();
const c = require("../controllers/sessionController");
const { protect } = require("../middleware/auth");
router.use(protect);
router.get("/active", c.active);
router.post("/:id/start", c.start);
router.post("/:id/end", c.end);
router.post("/:id/extend", c.extend);
module.exports = router;
