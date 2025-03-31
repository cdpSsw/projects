const jwt = require("jsonwebtoken");
require('dotenv').config(); 

const SECRET_KEY = process.env.JWT_SECRET;

const authorize = (roles) => {
    return (req, res, next) => {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: "Unauthorized" });
  
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (!roles.includes(decoded.role)) {
          return res.status(403).json({ message: "Forbidden" });
        }

        req.user = decoded;
        next();
        
      } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
      }
    };
};

module.exports = authorize; 
