const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const initMYSQL = require("../../config/db");
const tb = "users";

// Login Route
router.post("/", async (req, res) => {
  try {
    const conn = await initMYSQL();
    const { studentID, password } = req.body;
    // console.log(req.body)

    // ตรวจสอบว่ามีค่า id และ password หรือไม่
    if (!studentID|| !password) {
      return res.status(400).json({ error: "Missing required field" });
    }

    // ดึงข้อมูลนักศึกษาจากฐานข้อมูล
    const [result] = await conn.query(
      `SELECT studentID, password, status, role FROM ${tb} WHERE studentID = ?`,
      [studentID]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: `Student ID ${id} not found` });
    }

    const user = result[0];

    // เช็คว่าสถานะถูก Approve ไหม
    if (user.status !== "Approved") {
      return res.status(403).json({ error: "Account not approved yet" });
    }

    // เปรียบเทียบรหัสผ่าน
    // const isMatch = await bcrypt.compare('42152Tong$', '$2b$10$PVd06wHZKs93od8rg.3YYeHhqTauT7WnBXKWHaaGENwA/2tlaTpOK');
    // console.log(isMatch); // ควรแสดง true ถ้าผ่านการเปรียบเทียบ
    
    const isMatch = await bcrypt.compare(password, user.password.trim());
    
    // console.log("Input Password: ", password);  // รหัสผ่านที่ผู้ใช้กรอก
    // console.log("Stored Password: ", user.password);  // รหัสผ่านที่เก็บในฐานข้อมูล
    // console.log("Do they match? ", isMatch);  // จะบอกว่า rpassword ตรงกันหรือไม่
    if (isMatch) {
      console.log("Passwords match!");
    } else {
      console.log("Passwords do not match!");
}


    // สร้าง JWT Token
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });

    // ส่ง token ไปยัง Client (ผ่าน cookie และ response)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 3600000, // 1 ชั่วโมง
    });

    return res.status(200).json({ message: "Login Successful", role: user.role, token });
  
  } catch (err) {
    console.error(`Error getting ${tb}: ${err}`);
    res.status(500).json({ error: `Internal server error` });
  }
});

module.exports = router;
