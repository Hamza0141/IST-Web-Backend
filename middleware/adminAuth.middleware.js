const jwt = require("jsonwebtoken");

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;

function adminAuth(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;

    if (req.cookies?.admin_token) {
      token = req.cookies.admin_token;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: token missing",
      });
    }

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: invalid token",
    });
  }
}

module.exports = adminAuth;