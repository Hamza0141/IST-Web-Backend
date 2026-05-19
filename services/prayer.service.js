const pool = require("../config/db.config");

async function createPrayerSetting(data, adminId) {
  const { prayer_name, adhan_time, iqama_time, is_active = 1 } = data;

  if (!prayer_name || !iqama_time) {
    throw new Error("prayer_name and iqama_time are required");
  }

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM prayer_settings WHERE prayer_name = ? LIMIT 1`,
      [prayer_name]
    );

    if (existing.length > 0) {
      throw new Error("Prayer setting already exists for this prayer_name");
    }

    const [result] = await connection.query(
      `
      INSERT INTO prayer_settings (
        prayer_name,
        adhan_time,
        iqama_time,
        is_active,
        updated_by
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [prayer_name, adhan_time || null, iqama_time, is_active, adminId || null]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        prayer_name,
        adhan_time,
        iqama_time,
        is_active,
        updated_by,
        created_at,
        updated_at
      FROM prayer_settings
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

async function getAllPrayerSettings() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        ps.id,
        ps.prayer_name,
        ps.adhan_time,
        ps.iqama_time,
        ps.is_active,
        ps.updated_by,
        ps.created_at,
        ps.updated_at,
        a.first_name AS updated_by_first_name,
        a.last_name AS updated_by_last_name,
        a.admin_email AS updated_by_email
      FROM prayer_settings ps
      LEFT JOIN admin a ON ps.updated_by = a.profile_id
      ORDER BY FIELD(ps.prayer_name, 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah1', 'Jumuah2')
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getPrayerSettingById(id) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        prayer_name,
        adhan_time,
        iqama_time,
        is_active,
        updated_by,
        created_at,
        updated_at
      FROM prayer_settings
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

async function updatePrayerSetting(id, data, adminId) {
  const { prayer_name, adhan_time, iqama_time, is_active } = data;

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id, prayer_name FROM prayer_settings WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Prayer setting not found");
    }

    if (prayer_name && prayer_name !== existing[0].prayer_name) {
      const [duplicate] = await connection.query(
        `SELECT id FROM prayer_settings WHERE prayer_name = ? AND id != ? LIMIT 1`,
        [prayer_name, id]
      );

      if (duplicate.length > 0) {
        throw new Error("Another prayer setting already uses this prayer_name");
      }
    }

    await connection.query(
      `
      UPDATE prayer_settings
      SET
        prayer_name = COALESCE(?, prayer_name),
        adhan_time = COALESCE(?, adhan_time),
        iqama_time = COALESCE(?, iqama_time),
        is_active = COALESCE(?, is_active),
        updated_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        prayer_name ?? null,
        adhan_time ?? null,
        iqama_time ?? null,
        is_active ?? null,
        adminId || null,
        id,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        prayer_name,
        adhan_time,
        iqama_time,
        is_active,
        updated_by,
        created_at,
        updated_at
      FROM prayer_settings
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

async function deletePrayerSetting(id) {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM prayer_settings WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Prayer setting not found");
    }

    await connection.query(`DELETE FROM prayer_settings WHERE id = ?`, [id]);

    return true;
  } finally {
    connection.release();
  }
}

module.exports = {
  createPrayerSetting,
  getAllPrayerSettings,
  getPrayerSettingById,
  updatePrayerSetting,
  deletePrayerSetting,
};