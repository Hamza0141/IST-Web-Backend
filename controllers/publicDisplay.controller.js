const publicDisplayService = require("../services/publicDisplay.service");

async function getPublicPrayers(req, res) {
  try {
    const prayerData = await publicDisplayService.getMergedPrayerSettings();

    return res.status(200).json({
      success: true,
      count: prayerData.prayers.length,
      prayers: prayerData.prayers,
      hijri: prayerData.hijri,
      gregorian: prayerData.gregorian,
      readable_date: prayerData.readable,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public prayer settings",
    });
  }
}

async function getPublicAnnouncements(req, res) {
  try {
    const announcements = await publicDisplayService.getPublicAnnouncements();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public announcements",
    });
  }
}

async function getPublicSlides(req, res) {
  try {
    const slides = await publicDisplayService.getPublicSlides();

    return res.status(200).json({
      success: true,
      count: slides.length,
      slides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch public slides",
    });
  }
}

async function getPublicDisplayScreens(req, res) {
  try {
    const screens = await publicDisplayService.getPublicDisplayScreens();

    return res.status(200).json({
      success: true,
      count: screens.length,
      screens,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch display screens",
    });
  }
}

async function getPublicDisplayData(req, res) {
  try {
    const { screen_code } = req.params;

    const data = await publicDisplayService.getPublicDisplayData(screen_code);

    return res.status(200).json({
      success: true,
      message: "Public display data fetched successfully",
      data,
    });
  } catch (error) {
    const statusCode =
      error.message === "Display screen not found"
        ? 404
        : error.message === "Display screen is inactive"
        ? 403
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to fetch public display data",
    });
  }
}

module.exports = {
  getPublicPrayers,
  getPublicAnnouncements,
  getPublicSlides,
  getPublicDisplayScreens,
  getPublicDisplayData,
};