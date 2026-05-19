const express = require("express");
const router = express.Router();

const adminRoutes = require("./admin.routes");
const prayerRoutes = require("./prayer.routes");
const announcementRoutes = require("./announcement.routes");
const slideRoutes = require("./slide.routes");
const displayScreenRoutes = require("./displayScreen.routes");
const publicDisplayRoutes = require("./publicDisplay.routes");


router.use("/prayers", prayerRoutes);
router.use("/admin", adminRoutes);
router.use("/announcements", announcementRoutes);
router.use("/slides", slideRoutes);
router.use("/display-screens", displayScreenRoutes);
router.use("/public", publicDisplayRoutes)

module.exports = router;