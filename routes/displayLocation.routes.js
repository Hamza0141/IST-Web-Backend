const express = require("express");
const router = express.Router();

const {
  createDisplayLocation,
  getAllDisplayLocations,
  getDisplayLocationById,
  updateDisplayLocation,
  deleteDisplayLocation,
} = require("../controllers/displayLocation.controller");

router.post("/", createDisplayLocation);
router.get("/", getAllDisplayLocations);
router.get("/:id", getDisplayLocationById);
router.put("/:id", updateDisplayLocation);
router.delete("/:id", deleteDisplayLocation);

module.exports = router;