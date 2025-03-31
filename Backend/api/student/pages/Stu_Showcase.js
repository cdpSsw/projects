const router = require("express").Router();
const initMYSQL = require("../../../config/db");
const tb = "stuShowcase";

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const imagePath = path.join(__dirname, "../../../public/images/stu_showcase");

const authorize = require('../../middlewares/authorize');

if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    return cb(null, imagePath);
  },
  filename: (_, file, cb) => {
    const randomString = Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const fileName = `${timestamp}_${randomString}_${file.originalname}`;
    return cb(null, fileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed!"));
    }
    cb(null, true);
  },
});

// -------------- admin (wait for middleware) ------------------------------------------
router.get("/", authorize(["admin"]), async (_, res) => {
  try {
    const conn = await initMYSQL();
    const [result] = await conn.query(`SELECT * FROM ${tb} `);
    res.send(result);
    conn.end(); // ปิดการเชื่อมต่อหลังใช้งานเสร็จ

  } catch (err) {
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

// -------------- showcase (only approved) ------------------------------------------
router.get('/approved', async (_, res) => {
  try {
    const conn = await initMYSQL();
    const [result] = await conn.query(`SELECT * FROM ${tb} WHERE status = 'Approved'`);
    res.status(200).send(result);
    conn.end();
  } catch (err) {
    return res.status(500).send({ message: `Internal server error: ${err}` });
  }
});

router.put("/status/:id", authorize(["admin"]), async (req, res) => {
  try {
    const conn = await initMYSQL();
    const { id } = req.params;
    const { status } = req.body;
    console.log(req.body);
    console.log(req.params);

    // อัปเดตฐานข้อมูล
    await conn.query(
      `UPDATE ${tb} SET status = ? WHERE id = ?`,
      [status, id]
    );

    return res.status(200).json({ message: "Update Successful" });

  } catch (err) {
    console.error(`Error: ${err}`);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
});

// ------------------------------- student ----------------------------------------------
router.get("/:studentID", authorize(["admin", "student"]), async (req, res) => {
  try {
    const conn = await initMYSQL();
    const { studentID } = req.params;
    const [result] = await conn.query(
      `SELECT * FROM ${tb} WHERE studentID = ?`,
      [studentID]
    );
    res.send(result);
    conn.end();

  } catch (err) {
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

router.post("/", authorize(["admin", "student"]), upload.single("image"), async (req, res) => {
  try {
    const conn = await initMYSQL();
    const { studentID, topic, description } = req.body;
    const image = req.file ? req.file.filename : null;
    console.log(req.body);
    console.log(res.files);

    const [result] = await conn.query(
      `INSERT INTO ${tb} (studentID, topic, description, image) VALUES (?, ?, ?, ?)`,
      [studentID, topic, description, image]
    );

    res.status(200).send({ insertID: result.insertId });
    conn.end(); // ปิดการเชื่อมต่อหลังใช้งานเสร็จ
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).send(`Internal server error: ${err.message}`);
  }
});

router.put("/:id", authorize(["admin", "student"]), upload.single("image"), async (req, res) => {
  console.log(req.body);
  
  try {
    const conn = await initMYSQL();
    const { id } = req.params;
    const { topic, description } = req.body;
    console.log(req.body);
    console.log(req.params);

    // ดึงข้อมูลกิจกรรมเก่าจากฐานข้อมูล
    const [existingActivity] = await conn.query(
      `SELECT image FROM ${tb} WHERE id = ?`,
      [id]
    );
    if (existingActivity.length === 0) {
      return res.status(404).json({ error: "Activity not found" });
    }

    const oldImage = existingActivity[0].image;
    const newImage = req.file ? req.file.filename : oldImage; // ใช้รูปใหม่ถ้ามีการอัปโหลด

    // ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (!topic || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // อัปเดตฐานข้อมูล
    const [result] = await conn.query(
      `UPDATE ${tb} SET topic = ?, description = ?, image = ? WHERE id = ?`,
      [topic, description, newImage, id]
    );

    if (result.affectedRows > 0) {
      // ถ้ามีการอัปโหลดรูปใหม่ ให้ลบรูปเก่าทิ้ง
      if (req.file && oldImage) {
        const oldFilePath = path.join(imagePath, oldImage);
        try {
          await fs.promises.access(oldFilePath, fs.constants.F_OK);
          await fs.promises.unlink(oldFilePath);
          console.log(`Deleted old image: ${oldImage}`);
        } catch (err) {
          console.error(`Failed to delete old image: ${err}`);
        }
      }
      return res.status(200).json({ message: "Update Successful" });
      
    } else {
      return res.status(400).json({ message: "Update failed" });
    }

  } catch (err) {
    console.error(`Error: ${err}`);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
});

router.delete("/:id", authorize(["admin", "student"]), async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await initMYSQL();

    // ดึงชื่อไฟล์จากฐานข้อมูล
    const [imageResult] = await conn.query(
      `SELECT image FROM ${tb} WHERE id = ?`,
      [id]
    );

    if (imageResult.length === 0) {
      return res.status(404).json({ error: "image not found" });
    }

    const filename = imageResult[0].image;
    const filePath = path.join(imagePath, filename);

    // ลบข้อมูลจากฐานข้อมูล
    const [deleteResult] = await conn.query(`DELETE FROM ${tb} WHERE id = ?`, [
      id,
    ]);

    if (deleteResult.affectedRows === 0) {
      return res
        .status(400)
        .json({ error: "Failed to delete data from database" });
    }

    console.log("Database Delete Successful");

    // ตรวจสอบไฟล์ว่ามีอยู่จริงก่อนลบ
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      await fs.promises.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (fileErr) {
      console.error(
        `File not found or failed to delete: ${filePath}, error: ${fileErr}`
      );
    }

    return res.status(200).json({ message: "Delete Successful" });
  } catch (err) {
    console.error(`Error: ${err}`);
    return res.status(500).json({ error: `Internal Server Error: ${err}` });
  }
});

module.exports = router;
