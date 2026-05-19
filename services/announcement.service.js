const pool = require("../config/db.config");

const ALLOWED_PRIORITIES = ["low", "medium", "high"];

async function createAnnouncement(data, profileId) {
  const {
    title,
    body,
    priority = "medium",
    start_at = null,
    end_at = null,
    is_active = 1,
  } = data;

  if (!title || !body) {
    throw new Error("title and body are required");
  }

  if (!ALLOWED_PRIORITIES.includes(priority)) {
    throw new Error(
      `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`
    );
  }

  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query(
      `
      INSERT INTO announcements (
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [title, body, priority, start_at, end_at, is_active, profileId || null]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM announcements
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

async function getAllAnnouncements() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM announcements
      ORDER BY created_at DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getActiveAnnouncements() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM announcements
      WHERE is_active = 1  
      ORDER BY
        FIELD(priority, 'high', 'medium', 'low'),
        created_at DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getAnnouncementById(id) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM announcements
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

async function updateAnnouncement(id, data) {
  const {
    title,
    body,
    priority,
    start_at,
    end_at,
    is_active,
  } = data;

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    throw new Error(
      `Invalid priority. Allowed values: ${ALLOWED_PRIORITIES.join(", ")}`
    );
  }

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM announcements WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Announcement not found");
    }

    await connection.query(
      `
      UPDATE announcements
      SET
        title = COALESCE(?, title),
        body = COALESCE(?, body),
        priority = COALESCE(?, priority),
        start_at = COALESCE(?, start_at),
        end_at = COALESCE(?, end_at),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        title ?? null,
        body ?? null,
        priority ?? null,
        start_at ?? null,
        end_at ?? null,
        is_active ?? null,
        id,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        body,
        priority,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM announcements
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

async function deleteAnnouncement(id) {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM announcements WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Announcement not found");
    }

    await connection.query(`DELETE FROM announcements WHERE id = ?`, [id]);

    return true;
  } finally {
    connection.release();
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