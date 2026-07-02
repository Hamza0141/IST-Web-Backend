const pool = require("../config/db.config");

const adminTable = `
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id CHAR(10) NOT NULL UNIQUE,
    admin_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'support') DEFAULT 'admin',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const prayerSettingsTable = `
CREATE TABLE IF NOT EXISTS prayer_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prayer_name VARCHAR(50) NOT NULL UNIQUE,
    adhan_time TIME NULL,
    iqama_time TIME NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    updated_by CHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prayer_updated_by
      FOREIGN KEY (updated_by) REFERENCES admin(profile_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
);
`;

const announcementsTable = `
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_by CHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_announcement_created_by
      FOREIGN KEY (created_by) REFERENCES admin(profile_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
);
`;

const slidesTable = `
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NULL,
    image_url VARCHAR(500) NULL,
    slide_order INT DEFAULT 1,
    duration_seconds INT DEFAULT 10,
    start_at DATETIME NULL,
    end_at DATETIME NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_by CHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_slide_created_by
      FOREIGN KEY (created_by) REFERENCES admin(profile_id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
);
`;

const displayLocationsTable = `
CREATE TABLE IF NOT EXISTS display_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_name VARCHAR(150) NOT NULL UNIQUE,
    location_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const displayScreensTable = `
CREATE TABLE IF NOT EXISTS display_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    screen_name VARCHAR(150) NOT NULL,
    screen_code VARCHAR(100) NOT NULL UNIQUE,
    location_id INT NULL,
    device_token VARCHAR(255) NULL,
    last_seen_at DATETIME NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_display_screen_location
      FOREIGN KEY (location_id) REFERENCES display_locations(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
);
`;

const slideDisplayScreensTable = `
CREATE TABLE IF NOT EXISTS slide_display_screens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slide_id INT NOT NULL,
    screen_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_slide_screen (slide_id, screen_id),
    CONSTRAINT fk_slide_target_slide
      FOREIGN KEY (slide_id) REFERENCES slides(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    CONSTRAINT fk_slide_target_screen
      FOREIGN KEY (screen_id) REFERENCES display_screens(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
);
`;

const appSettingsTable = `
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mosque_name VARCHAR(255) NOT NULL,
    mosque_address VARCHAR(255) NULL,
    timezone VARCHAR(100) DEFAULT 'America/Chicago',
    logo_url VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const prayerSeed = `
INSERT IGNORE INTO prayer_settings (prayer_name, adhan_time, iqama_time)
VALUES
('Fajr', '05:30:00', '06:00:00'),
('Dhuhr', '13:00:00', '13:20:00'),
('Asr', '17:00:00', '17:15:00'),
('Maghrib', '19:30:00', '19:35:00'),
('Isha', '21:00:00', '21:15:00'),
('Jumuah1', '13:10:00', '13:10:00'),
('Jumuah2', '14:10:00', '14:10:00');
`;

const displayLocationSeed = `
INSERT IGNORE INTO display_locations (
    location_name,
    location_code,
    description
)
VALUES
('Main Prayer Hall', 'main-prayer-hall', 'Primary display area inside the main prayer hall'),
('Sisters Area', 'sisters-area', 'Display assigned to the sisters prayer area'),
('Lobby', 'lobby', 'Display assigned to the mosque lobby or entrance area'),
('Classroom', 'classroom', 'Display assigned to classroom or education area'),
('General Display', 'general-display', 'Default display location');
`;

const appSettingsSeed = `
INSERT INTO app_settings (
    id,
    mosque_name,
    mosque_address,
    timezone,
    logo_url
)
VALUES (
    1,
    'Islamic Society of Tulsa',
    'Tulsa, Oklahoma',
    'America/Chicago',
    NULL
)
ON DUPLICATE KEY UPDATE
    mosque_name = VALUES(mosque_name),
    mosque_address = VALUES(mosque_address),
    timezone = VALUES(timezone),
    logo_url = VALUES(logo_url);
`;

const defaultadmin=`INSERT INTO admin (
    profile_id,
    admin_email,
    first_name,
    last_name,
    password_hash,
    role,
    is_active
)
VALUES (
    '66fe700224',
    'hamza@istmosque.org',
    'Hamza',
    'Admin',
    '$2b$10$oCIOk/.rsjtghzRGpaM5D.NaxYuBBzWvFtFhG50YAd259ZzmjoCTW',
    'admin',
    1
)
ON DUPLICATE KEY UPDATE
    admin_email = VALUES(admin_email),
    password_hash = VALUES(password_hash),
    role = 'admin',
    is_active = 1;`

async function createTables() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /**
     * IMPORTANT ORDER:
     * 1. admin first, because prayer_settings, announcements, and slides reference admin(profile_id)
     * 2. slides before slide_display_screens
     * 3. display_locations before display_screens
     * 4. display_screens before slide_display_screens
     */

    await connection.query(adminTable);
    await connection.query(prayerSettingsTable);
    await connection.query(announcementsTable);
    await connection.query(slidesTable);
    await connection.query(displayLocationsTable);
    await connection.query(displayScreensTable);
    await connection.query(slideDisplayScreensTable);
    await connection.query(appSettingsTable);

    await connection.query(prayerSeed);
    await connection.query(displayLocationSeed);
    await connection.query(appSettingsSeed);
    await connection.query(defaultadmin);
    

    await connection.commit();

    console.log("All tables checked/created successfully.");
  } catch (err) {
    await connection.rollback();

    console.error("Error creating tables:", err.message);

    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { createTables };