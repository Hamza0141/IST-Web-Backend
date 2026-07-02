const pool = require("../config/db.config");

function normalizeLocationCode(locationCode) {
  return String(locationCode || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

async function getDisplayLocationById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      id,
      location_name,
      location_code,
      description,
      is_active,
      created_at,
      updated_at
    FROM display_locations
    WHERE id = ?
    `,
    [id]
  );

  return rows[0] || null;
}

async function getAllDisplayLocations({ activeOnly = false } = {}) {
  let sql = `
    SELECT
      id,
      location_name,
      location_code,
      description,
      is_active,
      created_at,
      updated_at
    FROM display_locations
  `;

  if (activeOnly) {
    sql += ` WHERE is_active = 1 `;
  }

  sql += ` ORDER BY location_name ASC `;

  const [rows] = await pool.query(sql);

  return rows;
}

async function createDisplayLocation(payload) {
  const { location_name, location_code, description, is_active } = payload;

  if (!location_name) {
    throw new Error("Location name is required");
  }

  if (!location_code) {
    throw new Error("Location code is required");
  }

  const normalizedLocationCode = normalizeLocationCode(location_code);

  const [existingRows] = await pool.query(
    `
    SELECT id
    FROM display_locations
    WHERE location_code = ?
       OR location_name = ?
    LIMIT 1
    `,
    [normalizedLocationCode, location_name.trim()]
  );

  if (existingRows.length > 0) {
    throw new Error("Display location already exists");
  }

  const [result] = await pool.query(
    `
    INSERT INTO display_locations (
      location_name,
      location_code,
      description,
      is_active
    )
    VALUES (?, ?, ?, ?)
    `,
    [
      location_name.trim(),
      normalizedLocationCode,
      description || null,
      typeof is_active === "undefined" ? 1 : is_active,
    ]
  );

  return getDisplayLocationById(result.insertId);
}

async function updateDisplayLocation(id, payload) {
  const existing = await getDisplayLocationById(id);

  if (!existing) {
    throw new Error("Display location not found");
  }

  const { location_name, location_code, description, is_active } = payload;

  let normalizedLocationCode = null;

  if (location_code) {
    normalizedLocationCode = normalizeLocationCode(location_code);
  }

  if (location_name || normalizedLocationCode) {
    const [duplicateRows] = await pool.query(
      `
      SELECT id
      FROM display_locations
      WHERE id <> ?
        AND (
          location_name = COALESCE(?, location_name)
          OR location_code = COALESCE(?, location_code)
        )
      LIMIT 1
      `,
      [
        id,
        location_name ? location_name.trim() : null,
        normalizedLocationCode,
      ]
    );

    if (duplicateRows.length > 0) {
      throw new Error("Display location already exists");
    }
  }

  await pool.query(
    `
    UPDATE display_locations
    SET
      location_name = COALESCE(?, location_name),
      location_code = COALESCE(?, location_code),
      description = ?,
      is_active = COALESCE(?, is_active)
    WHERE id = ?
    `,
    [
      location_name ? location_name.trim() : null,
      normalizedLocationCode,
      typeof description === "undefined" ? existing.description : description,
      typeof is_active === "undefined" ? null : is_active,
      id,
    ]
  );

  return getDisplayLocationById(id);
}

async function deleteDisplayLocation(id) {
  const existing = await getDisplayLocationById(id);

  if (!existing) {
    throw new Error("Display location not found");
  }

  // Soft delete location.
  await pool.query(
    `
    UPDATE display_locations
    SET is_active = 0
    WHERE id = ?
    `,
    [id]
  );

  return true;
}

module.exports = {
  createDisplayLocation,
  getAllDisplayLocations,
  getDisplayLocationById,
  updateDisplayLocation,
  deleteDisplayLocation,
};