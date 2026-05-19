const slideService = require("../services/slide.service");

async function createSlide(req, res) {
  try {
    const slide = await slideService.createSlide(
      req.body,
      req.admin.profile_id
    );

    return res.status(201).json({
      success: true,
      message: "Slide created successfully",
      slide,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create slide",
    });
  }
}

async function getAllSlides(req, res) {
  try {
    const slides = await slideService.getAllSlides();

    return res.status(200).json({
      success: true,
      count: slides.length,
      slides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch slides",
    });
  }
}

async function getActiveSlides(req, res) {
  try {
    const slides = await slideService.getActiveSlides();

    return res.status(200).json({
      success: true,
      count: slides.length,
      slides,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch active slides",
    });
  }
}

async function getSlideById(req, res) {
  try {
    const slide = await slideService.getSlideById(req.params.id);

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: "Slide not found",
      });
    }

    return res.status(200).json({
      success: true,
      slide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch slide",
    });
  }
}

async function updateSlide(req, res) {
  try {
    const slide = await slideService.updateSlide(req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: "Slide updated successfully",
      slide,
    });
  } catch (error) {
    const statusCode = error.message === "Slide not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update slide",
    });
  }
}

async function deleteSlide(req, res) {
  try {
    await slideService.deleteSlide(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Slide deleted successfully",
    });
  } catch (error) {
    const statusCode = error.message === "Slide not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to delete slide",
    });
  }
}

module.exports = {
  createSlide,
  getAllSlides,
  getActiveSlides,
  getSlideById,
  updateSlide,
  deleteSlide,
};