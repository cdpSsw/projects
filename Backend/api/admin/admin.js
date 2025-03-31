const router = require("express").Router();
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');

// Route ที่ต้องเป็น Admin เท่านั้น
router.get("/dashboard", authenticateToken, authorizeAdmin, (req, res) => {
  res.json({ message: "Welcome to Admin Dashboard!" });
});

module.exports = router;
