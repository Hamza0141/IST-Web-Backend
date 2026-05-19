const prayerService = require("../services/prayer.service");

async function createPrayerSetting(req, res) {
  try {
const prayer = await prayerService.createPrayerSetting(
  req.body,
  req.admin.profile_id
);

    return res.status(201).json({
      success: true,
      message: "Prayer setting created successfully",
      prayer,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create prayer setting",
    });
  }
}

async function getAllPrayerSettings(req, res) {
  try {
    const prayers = await prayerService.getAllPrayerSettings();

    return res.status(200).json({
      success: true,
      count: prayers.length,
      prayers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch prayer settings",
    });
  }
}

async function getPrayerSettingById(req, res) {
  try {
    const prayer = await prayerService.getPrayerSettingById(req.params.id);

    if (!prayer) {
      return res.status(404).json({
        success: false,
        message: "Prayer setting not found",
      });
    }

    return res.status(200).json({
      success: true,
      prayer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch prayer setting",
    });
  }
}

async function updatePrayerSetting(req, res) {
  try {
  const prayer = await prayerService.updatePrayerSetting(
  req.params.id,
  req.body,
  req.admin.profile_id
);

    return res.status(200).json({
      success: true,
      message: "Prayer setting updated successfully",
      prayer,
    });
  } catch (error) {
    const statusCode =
      error.message === "Prayer setting not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update prayer setting",
    });
  }
}

async function deletePrayerSetting(req, res) {
  try {
    await prayerService.deletePrayerSetting(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Prayer setting deleted successfully",
    });
  } catch (error) {
    const statusCode =
      error.message === "Prayer setting not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete prayer setting",
    });
  }
}

module.exports = {
  createPrayerSetting,
  getAllPrayerSettings,
  getPrayerSettingById,
  updatePrayerSetting,
  deletePrayerSetting,
};