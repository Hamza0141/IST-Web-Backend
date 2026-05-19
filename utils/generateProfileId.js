const crypto = require("crypto");

function generateProfileId() {
  return crypto.randomBytes(5).toString("hex");
}

module.exports = generateProfileId;