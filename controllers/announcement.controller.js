const announcementService = require("../services/announcement.service");

async function createAnnouncement(req, res) {
  try {
    const announcement = await announcementService.createAnnouncement(
      req.body,
      req.admin.profile_id
    );

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create announcement",
    });
  }
}

async function getAllAnnouncements(req, res) {
  try {
    const announcements = await announcementService.getAllAnnouncements();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch announcements",
    });
  }
}

async function getActiveAnnouncements(req, res) {
  try {
    const announcements = await announcementService.getActiveAnnouncements();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch active announcements",
    });
  }
}

async function getAnnouncementById(req, res) {
  try {
    const announcement = await announcementService.getAnnouncementById(
      req.params.id
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch announcement",
    });
  }
}

async function updateAnnouncement(req, res) {
  try {
    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    const statusCode =
      error.message === "Announcement not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update announcement",
    });
  }
}

async function deleteAnnouncement(req, res) {
  try {
    await announcementService.deleteAnnouncement(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    const statusCode =
      error.message === "Announcement not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete announcement",
    });
  }
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getActiveAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
};