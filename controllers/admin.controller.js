const jwt = require("jsonwebtoken");
const adminService = require("../services/admin.service");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

async function createAdmin(req, res) {
  try {
    const admin = await adminService.createAdmin(req.body);

    return res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create admin",
    });
  }
}

async function loginAdmin(req, res) {
  try {
    const { admin_email, password } = req.body;

    const admin = await adminService.loginAdmin(admin_email, password);

    const token = jwt.sign(
      {
        
        profile_id: admin.profile_id,
        role: admin.role,
      },
      ADMIN_JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Login failed",
    });
  }
}

async function getCurrentAdmin(req, res) {
  try {
    const admin = await adminService.getAdminById(req.admin.profile_id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get admin",
    });
  }
}

async function getAllAdmins(req, res) {
  try {
    const admins = await adminService.getAllAdmins();

    return res.status(200).json({
      success: true,
      count: admins.length,
      admins,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admins",
    });
  }
}

async function logoutAdmin(req, res) {
  try {
    res.clearCookie("admin_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
}

async function getAdminByProfileId(req, res) {
  try {
    const admin = await adminService.getAdminByProfileId(req.params.profile_id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin",
    });
  }
}

async function updateAdmin(req, res) {
  try {
    const currentAdmin = await adminService.getAdminByProfileId(
      req.admin.profile_id
    );

    const targetProfileId = req.params.profile_id;
    const isSelf = currentAdmin.profile_id === targetProfileId;

    if (currentAdmin.role !== "admin" && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Support users can only update their own profile",
      });
    }

    const payload = { ...req.body };

    if (currentAdmin.role !== "admin") {
      delete payload.role;
      delete payload.is_active;
    }

    const updatedAdmin = await adminService.updateAdminProfile(
      targetProfileId,
      payload
    );

    return res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin,
    });
  } catch (error) {
    const statusCode = error.message === "Admin not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update admin",
    });
  }
}

async function updateAdminPassword(req, res) {
  try {
    const currentAdmin = await adminService.getAdminByProfileId(
      req.admin.profile_id
    );

    const targetProfileId = req.params.profile_id;
    const isSelf = currentAdmin.profile_id === targetProfileId;

    if (currentAdmin.role !== "admin" && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "Support users can only update their own password",
      });
    }

    await adminService.updateAdminPassword(targetProfileId, req.body.password);

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    const statusCode = error.message === "Admin not found" ? 404 : 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to update password",
    });
  }
}

module.exports = {
  createAdmin,
  loginAdmin,
  getCurrentAdmin,
  getAllAdmins,
  logoutAdmin,
  getAdminByProfileId,
  updateAdmin,
  updateAdminPassword,
};