const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"]; //

  if (!authHeader) return res.status(401).json({ message: "No token" });


  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7, authHeader.length) : authHeader;

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};