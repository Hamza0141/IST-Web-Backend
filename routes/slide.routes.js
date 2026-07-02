const express = require("express");
const router = express.Router();

const {
  createSlide,
  getAllSlides,
  getSlideById,
  updateSlide,
  deleteSlide,
} = require("../controllers/slide.controller");

router.post("/", createSlide);
router.get("/", getAllSlides);
router.get("/:id", getSlideById);
router.put("/:id", updateSlide);
router.delete("/:id", deleteSlide);

module.exports = router;