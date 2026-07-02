const pool = require("../config/db.config");
const { fetchDailyPrayerData } = require("./aladhan.service");

function normalizeScreenCode(screenCode) {
  return String(screenCode || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

async function getLocalIqamaSettings() {
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
        updated_at
      FROM prayer_settings
      WHERE is_active = 1
      ORDER BY FIELD(
        prayer_name,
        'Fajr',
        'Dhuhr',
        'Asr',
        'Maghrib',
        'Isha',
        'Jumuah1',
        'Jumuah2'
      )
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getMergedPrayerSettings() {
  const localPrayers = await getLocalIqamaSettings();
  const aladhanData = await fetchDailyPrayerData();

  const timings = aladhanData.timings;

  const prayerMap = {
    Fajr: timings.Fajr,
    Dhuhr: timings.Dhuhr,
    Asr: timings.Asr,
    Maghrib: timings.Maghrib,
    Isha: timings.Isha,
  };

  const prayers = localPrayers.map((prayer) => {
    const isJumuah =
      prayer.prayer_name === "Jumuah1" || prayer.prayer_name === "Jumuah2";

    return {
      id: prayer.id,
      prayer_name: prayer.prayer_name,
      adhan_time: isJumuah
        ? prayer.adhan_time
        : prayerMap[prayer.prayer_name] || null,
      iqama_time: prayer.iqama_time,
      is_active: prayer.is_active,
      updated_by: prayer.updated_by,
      updated_at: prayer.updated_at,
    };
  });

  return {
    prayers,
    hijri: aladhanData.hijri,
    gregorian: aladhanData.gregorian,
    readable: aladhanData.readable,
  };
}

async function getPublicAnnouncements() {
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
        created_at,
        updated_at
      FROM announcements
      WHERE is_active = 1
        AND (start_at IS NULL OR start_at <= NOW())
        AND (end_at IS NULL OR end_at >= NOW())
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

/**
 * General public slides endpoint.
 * This returns all active slides.
 * Useful for testing or a generic display.
 */
async function getPublicSlides() {
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

/**
 * Screen-specific slides.
 * This is the important one for TV display pages.
 * It returns ONLY slides assigned to the selected TV.
 */
async function getPublicSlidesForScreen(screenId) {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
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
      FROM slide_display_screens sds
      INNER JOIN slides s
        ON sds.slide_id = s.id
      WHERE sds.screen_id = ?
        AND s.is_active = 1
        AND (s.start_at IS NULL OR s.start_at <= NOW())
        AND (s.end_at IS NULL OR s.end_at >= NOW())
      ORDER BY s.slide_order ASC, s.created_at DESC
      `,
      [screenId]
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function getDisplayScreenByCode(screenCode) {
  const connection = await pool.getConnection();

  try {
    const normalizedScreenCode = normalizeScreenCode(screenCode);

    const [rows] = await connection.query(
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
      LIMIT 1
      `,
      [normalizedScreenCode]
    );

    return rows[0] || null;
  } finally {
    connection.release();
  }
}

async function getPublicDisplayScreens() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        ds.id,
        ds.screen_name,
        ds.screen_code,
        ds.location_id,
        dl.location_name,
        dl.location_code,
        ds.last_seen_at,
        ds.is_active
      FROM display_screens ds
      LEFT JOIN display_locations dl
        ON ds.location_id = dl.id
      WHERE ds.is_active = 1
      ORDER BY
        dl.location_name ASC,
        ds.screen_name ASC
      `
    );

    return rows;
  } finally {
    connection.release();
  }
}

async function updateDisplayLastSeen(screenCode) {
  const connection = await pool.getConnection();

  try {
    const normalizedScreenCode = normalizeScreenCode(screenCode);

    await connection.query(
      `
      UPDATE display_screens
      SET
        last_seen_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      WHERE screen_code = ?
      `,
      [normalizedScreenCode]
    );
  } finally {
    connection.release();
  }
}

async function getPublicDisplayData(screenCode) {
  const normalizedScreenCode = normalizeScreenCode(screenCode);

  const screen = await getDisplayScreenByCode(normalizedScreenCode);

  if (!screen) {
    throw new Error("Display screen not found");
  }

  if (!screen.is_active) {
    throw new Error("Display screen is inactive");
  }

  await updateDisplayLastSeen(normalizedScreenCode);

  const [prayerData, announcements, slides] = await Promise.all([
    getMergedPrayerSettings(),
    getPublicAnnouncements(),
    getPublicSlidesForScreen(screen.id),
  ]);

  return {
    screen,
    prayers: prayerData.prayers,
    hijri: prayerData.hijri,
    gregorian: prayerData.gregorian,
    readable_date: prayerData.readable,
    announcements,
    slides,
    server_time: new Date(),
  };
}

module.exports = {
  getLocalIqamaSettings,
  getMergedPrayerSettings,
  getPublicAnnouncements,
  getPublicSlides,
  getPublicSlidesForScreen,
  getDisplayScreenByCode,
  getPublicDisplayScreens,
  getPublicDisplayData,
};