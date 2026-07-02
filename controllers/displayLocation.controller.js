const displayLocationService = require("../services/displayLocation.service");

async function createDisplayLocation(req, res) {
  try {
    const displayLocation = await displayLocationService.createDisplayLocation(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Display location created successfully",
      display_location: displayLocation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create display location",
    });
  }
}

async function getAllDisplayLocations(req, res) {
  try {
    const activeOnly = req.query.activeOnly === "true";

    const displayLocations =
      await displayLocationService.getAllDisplayLocations({ activeOnly });

    return res.status(200).json({
      success: true,
      count: displayLocations.length,
      display_locations: displayLocations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch display locations",
    });
  }
}

async function getDisplayLocationById(req, res) {
  try {
    const displayLocation =
      await displayLocationService.getDisplayLocationById(req.params.id);

    if (!displayLocation) {
      return res.status(404).json({
        success: false,
        message: "Display location not found",
      });
    }

    return res.status(200).json({
      success: true,
      display_location: displayLocation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch display location",
    });
  }
}

async function updateDisplayLocation(req, res) {
  try {
    const displayLocation = await displayLocationService.updateDisplayLocation(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Display location updated successfully",
      display_location: displayLocation,
    });
  } catch (error) {
    const statusCode =
      error.message === "Display location not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update display location",
    });
  }
}

async function deleteDisplayLocation(req, res) {
  try {
    await displayLocationService.deleteDisplayLocation(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Display location deleted successfully",
    });
  } catch (error) {
    const statusCode =
      error.message === "Display location not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete display location",
    });
  }
}

module.exports = {
  createDisplayLocation,
  getAllDisplayLocations,
  getDisplayLocationById,
  updateDisplayLocation,
  deleteDisplayLocation,
};