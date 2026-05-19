const express = require("express");
const router = express.Router();

const slideController = require("../controllers/slide.controller");
const adminAuth = require("../middleware/adminAuth.middleware");

router.post("/create", adminAuth, slideController.createSlide);
router.get("/", adminAuth, slideController.getAllSlides);
router.get("/active", adminAuth, slideController.getActiveSlides);
router.get("/:id", adminAuth, slideController.getSlideById);
router.patch("/:id", adminAuth, slideController.updateSlide);
router.delete("/:id", adminAuth, slideController.deleteSlide);

module.exports = router;