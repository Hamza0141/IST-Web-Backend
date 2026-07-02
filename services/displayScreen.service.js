const pool = require("../config/db.config");

function normalizeScreenCode(screenCode) {
  return String(screenCode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

async function getDisplayScreenById(id) {
  const [rows] = await pool.query(
    `
    SELECT
      ds.id,
      ds.screen_name,
      ds.screen_code,
      ds.location_id,
      dl.location_name,
      dl.location_code,
      ds.device_token,
      ds.last_seen_at,
      ds.is_active,
      ds.created_at,
      ds.updated_at
    FROM display_screens ds
    LEFT JOIN display_locations dl
      ON ds.location_id = dl.id
    WHERE ds.id = ?
    `,
    [id]
  );

  return rows[0] || null;
}

async function getDisplayScreenByCode(screenCode) {
  const [rows] = await pool.query(
    `
    SELECT
      ds.id,
      ds.screen_name,
      ds.screen_code,
      ds.location_id,
      dl.location_name,
      dl.location_code,
      ds.device_token,
      ds.last_seen_at,
      ds.is_active,
      ds.created_at,
      ds.updated_at
    FROM display_screens ds
    LEFT JOIN display_locations dl
      ON ds.location_id = dl.id
    WHERE ds.screen_code = ?
    `,
    [screenCode]
  );

  return rows[0] || null;
}

async function getAllDisplayScreens({ activeOnly = false } = {}) {
  let sql = `
    SELECT
      ds.id,
      ds.screen_name,
      ds.screen_code,
      ds.location_id,
      dl.location_name,
      dl.location_code,
      ds.device_token,
      ds.last_seen_at,
      ds.is_active,
      ds.created_at,
      ds.updated_at
    FROM display_screens ds
    LEFT JOIN display_locations dl
      ON ds.location_id = dl.id
  `;

  if (activeOnly) {
    sql += ` WHERE ds.is_active = 1 `;
  }

  sql += `
    ORDER BY
      dl.location_name ASC,
      ds.screen_name ASC
  `;

  const [rows] = await pool.query(sql);

  return rows;
}

async function createDisplayScreen(payload) {
  const {
    screen_name,
    screen_code,
    location_id,
    device_token,
    is_active,
  } = payload;

  if (!screen_name) {
    throw new Error("Screen name is required");
  }

  if (!screen_code) {
    throw new Error("Screen code is required");
  }

  const normalizedScreenCode = normalizeScreenCode(screen_code);

  const [existingRows] = await pool.query(
    `
    SELECT id
    FROM display_screens
    WHERE screen_code = ?
    LIMIT 1
    `,
    [normalizedScreenCode]
  );

  if (existingRows.length > 0) {
    throw new Error("Screen code already exists");
  }

  if (location_id) {
    const [locationRows] = await pool.query(
      `
      SELECT id
      FROM display_locations
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
      `,
      [location_id]
    );

    if (locationRows.length === 0) {
      throw new Error("Selected display location does not exist");
    }
  }

  const [result] = await pool.query(
    `
    INSERT INTO display_screens (
      screen_name,
      screen_code,
      location_id,
      device_token,
      is_active
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      screen_name.trim(),
      normalizedScreenCode,
      location_id || null,
      device_token || null,
      typeof is_active === "undefined" ? 1 : is_active,
    ]
  );

  return getDisplayScreenById(result.insertId);
}

async function updateDisplayScreen(id, payload) {
  const existing = await getDisplayScreenById(id);

  if (!existing) {
    throw new Error("Display screen not found");
  }

  const {
    screen_name,
    screen_code,
    location_id,
    device_token,
    is_active,
  } = payload;

  let normalizedScreenCode = null;

  if (screen_code) {
    normalizedScreenCode = normalizeScreenCode(screen_code);

    const [duplicateRows] = await pool.query(
      `
      SELECT id
      FROM display_screens
      WHERE screen_code = ?
        AND id <> ?
      LIMIT 1
      `,
      [normalizedScreenCode, id]
    );

    if (duplicateRows.length > 0) {
      throw new Error("Screen code already exists");
    }
  }

  if (location_id) {
    const [locationRows] = await pool.query(
      `
      SELECT id
      FROM display_locations
      WHERE id = ?
        AND is_active = 1
      LIMIT 1
      `,
      [location_id]
    );

    if (locationRows.length === 0) {
      throw new Error("Selected display location does not exist");
    }
  }

  await pool.query(
    `
    UPDATE display_screens
    SET
      screen_name = COALESCE(?, screen_name),
      screen_code = COALESCE(?, screen_code),
      location_id = ?,
      device_token = ?,
      is_active = COALESCE(?, is_active)
    WHERE id = ?
    `,
    [
      screen_name ? screen_name.trim() : null,
      normalizedScreenCode,
      typeof location_id === "undefined" ? existing.location_id : location_id,
      typeof device_token === "undefined" ? existing.device_token : device_token,
      typeof is_active === "undefined" ? null : is_active,
      id,
    ]
  );

  return getDisplayScreenById(id);
}

async function deleteDisplayScreen(id) {
  const existing = await getDisplayScreenById(id);

  if (!existing) {
    throw new Error("Display screen not found");
  }

  // Soft delete. This keeps slide assignment history but hides the TV.
  await pool.query(
    `
    UPDATE display_screens
    SET is_active = 0
    WHERE id = ?
    `,
    [id]
  );

  return true;
}

async function touchDisplayScreenLastSeen(screenCode) {
  await pool.query(
    `
    UPDATE display_screens
    SET last_seen_at = NOW()
    WHERE screen_code = ?
    `,
    [screenCode]
  );
}

async function getSlidesForDisplayScreen(screenCode) {
  if (!screenCode) {
    throw new Error("Screen code is required");
  }

  const normalizedScreenCode = normalizeScreenCode(screenCode);

  const screen = await getDisplayScreenByCode(normalizedScreenCode);

  if (!screen || Number(screen.is_active) !== 1) {
    throw new Error("Display screen not found");
  }

  const [rows] = await pool.query(
    `
    SELECT
      s.id,
      s.title,
      s.message,
      s.image_url,
      s.slide_order,
      s.duration_seconds,
      s.start_at,
      s.end_at,
      s.is_active,
      s.created_at,
      s.updated_at
    FROM display_screens ds
    INNER JOIN slide_display_screens sds
      ON ds.id = sds.screen_id
    INNER JOIN slides s
      ON sds.slide_id = s.id
    WHERE ds.screen_code = ?
      AND ds.is_active = 1
      AND s.is_active = 1
      AND (s.start_at IS NULL OR s.start_at <= NOW())
      AND (s.end_at IS NULL OR s.end_at >= NOW())
    ORDER BY s.slide_order ASC, s.created_at DESC
    `,
    [normalizedScreenCode]
  );

  await touchDisplayScreenLastSeen(normalizedScreenCode);

  return rows;
}

module.exports = {
  createDisplayScreen,
  getAllDisplayScreens,
  getDisplayScreenById,
  getDisplayScreenByCode,
  updateDisplayScreen,
  deleteDisplayScreen,
  getSlidesForDisplayScreen,
};