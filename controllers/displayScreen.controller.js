const displayScreenService = require("../services/displayScreen.service");

async function createDisplayScreen(req, res) {
  try {
    const displayScreen = await displayScreenService.createDisplayScreen(
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Display screen created successfully",
      display_screen: displayScreen,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create display screen",
    });
  }
}

async function getAllDisplayScreens(req, res) {
  try {
    const activeOnly = req.query.activeOnly === "true";

    const displayScreens = await displayScreenService.getAllDisplayScreens({
      activeOnly,
    });

    return res.status(200).json({
      success: true,
      count: displayScreens.length,
      display_screens: displayScreens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch display screens",
    });
  }
}

async function getDisplayScreenById(req, res) {
  try {
    const displayScreen = await displayScreenService.getDisplayScreenById(
      req.params.id
    );

    if (!displayScreen) {
      return res.status(404).json({
        success: false,
        message: "Display screen not found",
      });
    }

    return res.status(200).json({
      success: true,
      display_screen: displayScreen,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch display screen",
    });
  }
}

async function updateDisplayScreen(req, res) {
  try {
    const displayScreen = await displayScreenService.updateDisplayScreen(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Display screen updated successfully",
      display_screen: displayScreen,
    });
  } catch (error) {
    const statusCode =
      error.message === "Display screen not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update display screen",
    });
  }
}

async function deleteDisplayScreen(req, res) {
  try {
    await displayScreenService.deleteDisplayScreen(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Display screen deleted successfully",
    });
  } catch (error) {
    const statusCode =
      error.message === "Display screen not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete display screen",
    });
  }
}

async function getSlidesForDisplayScreen(req, res) {
  try {
    const slides = await displayScreenService.getSlidesForDisplayScreen(
      req.params.screenCode
    );

    return res.status(200).json({
      success: true,
      screen_code: req.params.screenCode,
      count: slides.length,
      slides,
    });
  } catch (error) {
    const statusCode =
      error.message === "Display screen not found" ? 404 : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch slides for display screen",
    });
  }
}

module.exports = {
  createDisplayScreen,
  getAllDisplayScreens,
  getDisplayScreenById,
  updateDisplayScreen,
  deleteDisplayScreen,
  getSlidesForDisplayScreen,
};