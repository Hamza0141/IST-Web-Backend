const pool = require("../config/db.config");

async function createSlide(data, profileId) {
  const {
    title,
    message = null,
    image_url = null,
    slide_order = 1,
    duration_seconds = 10,
    start_at = null,
    end_at = null,
    is_active = 1,
  } = data;

  if (!title) {
    throw new Error("title is required");
  }

  if (slide_order !== undefined && Number(slide_order) < 1) {
    throw new Error("slide_order must be at least 1");
  }

  if (duration_seconds !== undefined && Number(duration_seconds) < 1) {
    throw new Error("duration_seconds must be at least 1");
  }

  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query(
      `
      INSERT INTO slides (
        title,
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        title,
        message,
        image_url,
        Number(slide_order),
        Number(duration_seconds),
        start_at,
        end_at,
        is_active,
        profileId || null,
      ]
    );

    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM slides
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

async function getAllSlides() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM slides
      ORDER BY slide_order ASC, created_at DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getActiveSlides() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM slides
      WHERE is_active = 1
        AND (start_at IS NULL OR start_at <= NOW())
        AND (end_at IS NULL OR end_at >= NOW())
      ORDER BY slide_order ASC, created_at DESC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getSlideById(id) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        title,
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM slides
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

async function updateSlide(id, data) {
  const {
    title,
    message,
    image_url,
    slide_order,
    duration_seconds,
    start_at,
    end_at,
    is_active,
  } = data;

  if (slide_order !== undefined && Number(slide_order) < 1) {
    throw new Error("slide_order must be at least 1");
  }

  if (duration_seconds !== undefined && Number(duration_seconds) < 1) {
    throw new Error("duration_seconds must be at least 1");
  }

  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM slides WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Slide not found");
    }

    await connection.query(
      `
      UPDATE slides
      SET
        title = COALESCE(?, title),
        message = COALESCE(?, message),
        image_url = COALESCE(?, image_url),
        slide_order = COALESCE(?, slide_order),
        duration_seconds = COALESCE(?, duration_seconds),
        start_at = COALESCE(?, start_at),
        end_at = COALESCE(?, end_at),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        title ?? null,
        message ?? null,
        image_url ?? null,
        slide_order !== undefined ? Number(slide_order) : null,
        duration_seconds !== undefined ? Number(duration_seconds) : null,
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
        message,
        image_url,
        slide_order,
        duration_seconds,
        start_at,
        end_at,
        is_active,
        created_by,
        created_at,
        updated_at
      FROM slides
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

async function deleteSlide(id) {
  const connection = await pool.getConnection();

  try {
    const [existing] = await connection.query(
      `SELECT id FROM slides WHERE id = ? LIMIT 1`,
      [id]
    );

    if (existing.length === 0) {
      throw new Error("Slide not found");
    }

    await connection.query(`DELETE FROM slides WHERE id = ?`, [id]);

    return true;
  } finally {
    connection.release();
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