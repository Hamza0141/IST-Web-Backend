const express = require("express");
const router = express.Router();

const {
  createDisplayScreen,
  getAllDisplayScreens,
  getDisplayScreenById,
  updateDisplayScreen,
  deleteDisplayScreen,
  getSlidesForDisplayScreen,
} = require("../controllers/displayScreen.controller");

router.post("/", createDisplayScreen);
router.get("/", getAllDisplayScreens);

// TV-facing endpoint
// Example: GET /api/display-screens/LOBBY-TV-1/slides
router.get("/:screenCode/slides", getSlidesForDisplayScreen);

router.get("/:id", getDisplayScreenById);
router.put("/:id", updateDisplayScreen);
router.delete("/:id", deleteDisplayScreen);

module.exports = router;