const pool = require("../config/db.config");

async function createDisplayScreen(data) {
  const {
    screen_name,
    screen_code,
    location_name = null,
    device_token = null,
    last_seen_at = null,
    is_active = 1,
  } = data;

  if (!screen_name || !screen_code) {
    throw new Error("screen_name and screen_code are required");
  }

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM display_screens WHERE screen_code = ? LIMIT 1`,
      [screen_code]
    );

    if (existing.length > 0) {
      throw new Error("Display screen with this screen_code already exists");
    }

    const [result] = await connection.query(
      `
      INSERT INTO display_screens (
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
        created_at,
        updated_at
      FROM display_screens
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

async function getAllDisplayScreens() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
        created_at,
        updated_at
      FROM display_screens
      ORDER BY created_at DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getDisplayScreenById(id) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
        created_at,
        updated_at
      FROM display_screens
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function getDisplayScreenByCode(screenCode) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
        created_at,
        updated_at
      FROM display_screens
      WHERE screen_code = ?
      LIMIT 1
      `,
      [screenCode]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function updateDisplayScreen(id, data) {
  const {
    screen_name,
    screen_code,
    location_name,
    device_token,
    last_seen_at,
    is_active,
  } = data;

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id, screen_code FROM display_screens WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Display screen not found");
    }

    if (screen_code && screen_code !== existing[0].screen_code) {
      const [duplicate] = await connection.query(
        `SELECT id FROM display_screens WHERE screen_code = ? AND id != ? LIMIT 1`,
        [screen_code, id]
      );

      if (duplicate.length > 0) {
        throw new Error("Another display screen already uses this screen_code");
      }
    }

    await connection.query(
      `
      UPDATE display_screens
      SET
        screen_name = COALESCE(?, screen_name),
        screen_code = COALESCE(?, screen_code),
        location_name = COALESCE(?, location_name),
        device_token = COALESCE(?, device_token),
        last_seen_at = COALESCE(?, last_seen_at),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        screen_name ?? null,
        screen_code ?? null,
        location_name ?? null,
        device_token ?? null,
        last_seen_at ?? null,
        is_active ?? null,
        id,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        device_token,
        last_seen_at,
        is_active,
        created_at,
        updated_at
      FROM display_screens
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    return rows[0];
  } finally {
    connection.release();
  }
}

async function deleteDisplayScreen(id) {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM display_screens WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Display screen not found");
    }

    await connection.query(`DELETE FROM display_screens WHERE id = ?`, [id]);

    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  createDisplayScreen,
  getAllDisplayScreens,
  getDisplayScreenById,
  getDisplayScreenByCode,
  updateDisplayScreen,
  deleteDisplayScreen,
};