const express = require("express");
const router = express.Router();

const displayScreenController = require("../controllers/displayScreen.controller");
const adminAuth = require("../middleware/adminAuth.middleware");

router.post("/create", adminAuth, displayScreenController.createDisplayScreen);
router.get("/", adminAuth, displayScreenController.getAllDisplayScreens);
router.get("/:id", adminAuth, displayScreenController.getDisplayScreenById);
router.patch("/:id", adminAuth, displayScreenController.updateDisplayScreen);
router.delete("/:id", adminAuth, displayScreenController.deleteDisplayScreen);

module.exports = router;