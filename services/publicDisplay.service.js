const pool = require("../config/db.config");
const { fetchDailyPrayerData } = require("./aladhan.service");

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
      ORDER BY FIELD(prayer_name, 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Jumuah1', 'Jumuah2')
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

async function getPublicDisplayScreens() {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.query(
      `
      SELECT
        id,
        screen_name,
        screen_code,
        location_name,
        is_active
      FROM display_screens
      WHERE is_active = 1
      ORDER BY screen_name ASC
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
    await connection.query(
      `
      UPDATE display_screens
      SET
        last_seen_at = NOW(),
        updated_at = CURRENT_TIMESTAMP
      WHERE screen_code = ?
      `,
      [screenCode]
    );
  } finally {
    connection.release();
  }
}

async function getPublicDisplayData(screenCode) {
  const screen = await getDisplayScreenByCode(screenCode);

  if (!screen) {
    throw new Error("Display screen not found");
  }

  if (!screen.is_active) {
    throw new Error("Display screen is inactive");
  }

  await updateDisplayLastSeen(screenCode);

  const [prayerData, announcements, slides] = await Promise.all([
    getMergedPrayerSettings(),
    getPublicAnnouncements(),
    getPublicSlides(),
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
  getDisplayScreenByCode,
  getPublicDisplayScreens,
  getPublicDisplayData,
};