const router = require("express").Router();

router.post("/", (_, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None", // ต้องใช้ "None" และ `Secure: true` สำหรับ cross-site cookies
    domain: "localhost", // หรือ `yourdomain.com` ใน production
  });

  res.status(200).json({ message: "Signed out successfully" });
});

module.exports = router;
