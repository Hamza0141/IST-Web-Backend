const express = require("express");
const router = express.Router();

const announcementController = require("../controllers/announcement.controller");
const adminAuth = require("../middleware/adminAuth.middleware");

router.post("/create", adminAuth, announcementController.createAnnouncement);
router.get("/", adminAuth, announcementController.getAllAnnouncements);
router.get("/active", adminAuth, announcementController.getActiveAnnouncements);
router.get("/:id", adminAuth, announcementController.getAnnouncementById);
router.patch("/:id", adminAuth, announcementController.updateAnnouncement);
router.delete("/:id", adminAuth, announcementController.deleteAnnouncement);

module.exports = router;