const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const adminAuth = require("../middleware/adminAuth.middleware");

router.post("/create", adminAuth, adminController.createAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/logout", adminController.logoutAdmin);

router.get("/me", adminAuth, adminController.getCurrentAdmin);
router.get("/all", adminAuth, adminController.getAllAdmins);
router.get("/:profile_id", adminAuth, adminController.getAdminByProfileId);

router.patch("/:profile_id", adminAuth, adminController.updateAdmin);
router.patch("/:profile_id/password", adminAuth, adminController.updateAdminPassword);

module.exports = router;