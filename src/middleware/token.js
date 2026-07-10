const jwt = require("jsonwebtoken");
const env = require("../config/env");

const authenticate = async (req, res, next) => {
  console.log("🔐 Authenticate middleware called");
  console.log("📋 Headers:", req.headers);
  const autheader = req.headers.authorization;
  console.log("🔑 Authorization header:", autheader);

  if (!autheader || !autheader.startsWith("Bearer ")) {
    console.log("❌ No token or invalid format");
    return res.status(401).json({ message: "Access denied, no token provided" });
  }

  const token = autheader.split(" ")[1];
  console.log("✅ Token extracted:", token);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    console.log("✅ Token verified:", decoded);
    req.user = decoded;
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
    return res.status(401).json({ message: error.message });
  }

  next();
};

module.exports = authenticate;