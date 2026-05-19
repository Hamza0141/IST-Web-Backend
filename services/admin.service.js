const bcrypt = require("bcrypt");
const pool = require("../config/db.config");
const generateProfileId = require("../utils/generateProfileId");

async function createAdmin(data) {
  const { admin_email, first_name, last_name, password, role = "admin" } = data;

  if (!admin_email || !first_name || !last_name || !password) {
    throw new Error("All required fields must be provided");
  }

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM admin WHERE admin_email = ? LIMIT 1`,
      [admin_email]
    );

    if (existing.length > 0) {
      throw new Error("Admin with this email already exists");
    }

    const profile_id = generateProfileId();
    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `
      INSERT INTO admin (
        profile_id,
        admin_email,
        first_name,
        last_name,
        password_hash,
        role,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
      `,
      [profile_id, admin_email, first_name, last_name, password_hash, role]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        profile_id,
        admin_email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM admin
      WHERE id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return rows[0];
  } finally {
    connection.release();
  }
}

async function loginAdmin(admin_email, password) {
  if (!admin_email || !password) {
    throw new Error("Email and password are required");
  }

  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        profile_id,
        admin_email,
        first_name,
        last_name,
        password_hash,
        role,
        is_active
      FROM admin
      WHERE admin_email = ?
      LIMIT 1
      `,
      [admin_email]
    );

    if (rows.length === 0) {
      throw new Error("Invalid email or password");
    }

    const admin = rows[0];

    if (!admin.is_active) {
      throw new Error("Admin account is inactive");
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    delete admin.password_hash;

    return admin;
  } finally {
    connection.release();
  }
}

async function getAdminById(profile_id) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        profile_id,
        admin_email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM admin
      WHERE profile_id = ?
      LIMIT 1
      `,
      [profile_id]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function getAllAdmins() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        profile_id,
        admin_email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM admin
      ORDER BY id DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}
async function getAdminByProfileId(profileId) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        profile_id,
        admin_email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        updated_at
      FROM admin
      WHERE profile_id = ?
      LIMIT 1
      `,
      [profileId]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function updateAdminProfile(profileId, data) {
  const {
    admin_email,
    first_name,
    last_name,
    role,
    is_active,
  } = data;

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT profile_id FROM admin WHERE profile_id = ? LIMIT 1`,
      [profileId]
    );

    if (!existing.length) {
      throw new Error("Admin not found");
    }

    await connection.query(
      `
      UPDATE admin
      SET
        admin_email = COALESCE(?, admin_email),
        first_name = COALESCE(?, first_name),
        last_name = COALESCE(?, last_name),
        role = COALESCE(?, role),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE profile_id = ?
      `,
      [
        admin_email ?? null,
        first_name ?? null,
        last_name ?? null,
        role ?? null,
        is_active ?? null,
        profileId,
      ]
    );

    return getAdminByProfileId(profileId);
  } finally {
    connection.release();
  }
}

async function updateAdminPassword(profileId, password) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const connection = await pool.getConnection();

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await connection.query(
      `
      UPDATE admin
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE profile_id = ?
      `,
      [passwordHash, profileId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Admin not found");
    }

    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  createAdmin,
  loginAdmin,
  getAdminById,
  getAllAdmins,
  getAdminByProfileId,
  updateAdminProfile,
  updateAdminPassword,
};