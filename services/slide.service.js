const pool = require("../config/db.config");

async function getSlideById(id) {
  const [slideRows] = await pool.query(
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
    `,
    [id]
  );

  if (!slideRows.length) {
    return null;
  }

  const slide = slideRows[0];

  const [screenRows] = await pool.query(
    `
    SELECT
      ds.id,
      ds.screen_name,
      ds.screen_code,
      dl.location_name
    FROM slide_display_screens sds
    INNER JOIN display_screens ds
      ON sds.screen_id = ds.id
    LEFT JOIN display_locations dl
      ON ds.location_id = dl.id
    WHERE sds.slide_id = ?
    ORDER BY dl.location_name ASC, ds.screen_name ASC
    `,
    [id]
  );

  return {
    ...slide,
    screen_ids: screenRows.map((screen) => screen.id),
    screens: screenRows,
  };
}

async function validateScreenIds(screenIds) {
  if (!Array.isArray(screenIds) || screenIds.length === 0) {
    throw new Error("Select at least one TV/display for this slide");
  }

  const uniqueIds = [...new Set(screenIds.map((id) => Number(id)))].filter(
    Boolean
  );

  if (uniqueIds.length === 0) {
    throw new Error("Select at least one valid TV/display");
  }

  const [rows] = await pool.query(
    `
    SELECT id
    FROM display_screens
    WHERE id IN (?)
      AND is_active = 1
    `,
    [uniqueIds]
  );

  if (rows.length !== uniqueIds.length) {
    throw new Error("One or more selected TVs are invalid or inactive");
  }

  return uniqueIds;
}

async function getAllSlides() {
  const [slides] = await pool.query(
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

  if (!slides.length) {
    return [];
  }

  const slideIds = slides.map((slide) => slide.id);

  const [screenRows] = await pool.query(
    `
    SELECT
      sds.slide_id,
      ds.id,
      ds.screen_name,
      ds.screen_code,
      dl.location_name
    FROM slide_display_screens sds
    INNER JOIN display_screens ds
      ON sds.screen_id = ds.id
    LEFT JOIN display_locations dl
      ON ds.location_id = dl.id
    WHERE sds.slide_id IN (?)
    ORDER BY dl.location_name ASC, ds.screen_name ASC
    `,
    [slideIds]
  );

  const screensBySlideId = {};

  for (const row of screenRows) {
    if (!screensBySlideId[row.slide_id]) {
      screensBySlideId[row.slide_id] = [];
    }

    screensBySlideId[row.slide_id].push({
      id: row.id,
      screen_name: row.screen_name,
      screen_code: row.screen_code,
      location_name: row.location_name,
    });
  }

  return slides.map((slide) => ({
    ...slide,
    screen_ids: (screensBySlideId[slide.id] || []).map((screen) => screen.id),
    screens: screensBySlideId[slide.id] || [],
  }));
}

async function createSlide(payload) {
  const {
    title,
    message,
    image_url,
    slide_order,
    duration_seconds,
    start_at,
    end_at,
    is_active,
    created_by,
    screen_ids,
  } = payload;

  if (!title) {
    throw new Error("Slide title is required");
  }

  const validScreenIds = await validateScreenIds(screen_ids);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

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
        title.trim(),
        message || null,
        image_url || null,
        slide_order || 1,
        duration_seconds || 10,
        start_at || null,
        end_at || null,
        typeof is_active === "undefined" ? 1 : is_active,
        created_by || null,
      ]
    );

    const slideId = result.insertId;

    const targetValues = validScreenIds.map((screenId) => [
      slideId,
      screenId,
    ]);

    await connection.query(
      `
      INSERT INTO slide_display_screens (
        slide_id,
        screen_id
      )
      VALUES ?
      `,
      [targetValues]
    );

    await connection.commit();

    return getSlideById(slideId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function updateSlide(id, payload) {
  const existing = await getSlideById(id);

  if (!existing) {
    throw new Error("Slide not found");
  }

  const {
    title,
    message,
    image_url,
    slide_order,
    duration_seconds,
    start_at,
    end_at,
    is_active,
    screen_ids,
  } = payload;

  let validScreenIds = null;

  if (typeof screen_ids !== "undefined") {
    validScreenIds = await validateScreenIds(screen_ids);
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query(
      `
      UPDATE slides
      SET
        title = COALESCE(?, title),
        message = ?,
        image_url = ?,
        slide_order = COALESCE(?, slide_order),
        duration_seconds = COALESCE(?, duration_seconds),
        start_at = ?,
        end_at = ?,
        is_active = COALESCE(?, is_active)
      WHERE id = ?
      `,
      [
        title ? title.trim() : null,
        typeof message === "undefined" ? existing.message : message,
        typeof image_url === "undefined" ? existing.image_url : image_url,
        typeof slide_order === "undefined" ? null : slide_order,
        typeof duration_seconds === "undefined" ? null : duration_seconds,
        typeof start_at === "undefined" ? existing.start_at : start_at,
        typeof end_at === "undefined" ? existing.end_at : end_at,
        typeof is_active === "undefined" ? null : is_active,
        id,
      ]
    );

    if (validScreenIds) {
      await connection.query(
        `
        DELETE FROM slide_display_screens
        WHERE slide_id = ?
        `,
        [id]
      );

      const targetValues = validScreenIds.map((screenId) => [id, screenId]);

      await connection.query(
        `
        INSERT INTO slide_display_screens (
          slide_id,
          screen_id
        )
        VALUES ?
        `,
        [targetValues]
      );
    }

    await connection.commit();

    return getSlideById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function deleteSlide(id) {
  const existing = await getSlideById(id);

  if (!existing) {
    throw new Error("Slide not found");
  }

  await pool.query(
    `
    DELETE FROM slides
    WHERE id = ?
    `,
    [id]
  );

  return true;
}

module.exports = {
  createSlide,
  getAllSlides,
  getSlideById,
  updateSlide,
  deleteSlide,
};