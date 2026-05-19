const express = require("express");
const router = express.Router();

const publicDisplayController = require("../controllers/publicDisplay.controller");

router.get("/prayers", publicDisplayController.getPublicPrayers);
router.get("/announcements", publicDisplayController.getPublicAnnouncements);
router.get("/slides", publicDisplayController.getPublicSlides);
router.get("/display-screens", publicDisplayController.getPublicDisplayScreens);
router.get("/display/:screen_code", publicDisplayController.getPublicDisplayData);

module.exports = router;