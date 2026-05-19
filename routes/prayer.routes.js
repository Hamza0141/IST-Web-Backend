const express = require("express");
const router = express.Router();

const prayerController = require("../controllers/prayer.controller");
const adminAuth = require("../middleware/adminAuth.middleware");

router.post("/create", adminAuth, prayerController.createPrayerSetting);
router.get("/", adminAuth, prayerController.getAllPrayerSettings);
router.get("/:id", adminAuth, prayerController.getPrayerSettingById);
router.patch("/:id", adminAuth, prayerController.updatePrayerSetting);
router.delete("/:id", adminAuth, prayerController.deletePrayerSetting);

module.exports = router;