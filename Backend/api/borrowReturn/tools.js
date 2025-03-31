const router = require("express").Router();
const initMYSQL = require("../../config/db");
const tb = "tools";

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const imagePath = path.join(__dirname, "../../public/images/tools");

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

router.get("/", async (_, res) => {
  try {
    const conn = await initMYSQL();
    const [result] = await conn.query(`SELECT * FROM ${tb}`);
    res.send(result);
  } catch (err) {
    console.error(`Error getting ${tb}: ${err}`);
    res.status(500).send(`Error getting ${tb}`);
  }
});

router.post("/", upload.array("imgs", 4), async (req, res) => {
  // console.log("Files uploaded:", req.files);
  // console.log(req.body);

  try {
    const { name, description, quantity, available } = req.body;
    const img1 = req.files[0] ? req.files[0].filename : null;
    const img2 = req.files[1] ? req.files[1].filename : null;
    const img3 = req.files[2] ? req.files[2].filename : null;
    const img4 = req.files[3] ? req.files[3].filename : null;

    const conn = await initMYSQL();
    const [result] = await conn.query(
      `INSERT INTO ${tb} (name, description, quantity, available, img1, img2, img3, img4) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, quantity, available, img1, img2, img3, img4]
    );

    res.json({ insertId: result.insertId });
  } catch (err) {
    console.error(`Error inserting ${tb}: ${err}`);
    res.status(500).send(`Error inserting ${tb}`);
  }
});

router.put('/borrow/:id', async (req, res) => {
  try {
    const conn = await initMYSQL();
    const { id } = req.params;
    const { borrowCount } = req.body; // จำนวนที่ยืมไป

    // console.log(id);
    console.log(req.body);

    // ตรวจสอบจำนวนที่มีอยู่ก่อน
    const [quantityResult] = await conn.query(`SELECT quantity, available FROM ${tb} WHERE id = ?`, [id]);

    // คำนวณจำนวนที่เหลือ (quantity - available)
    // const currentQuantity = quantityResult[0].quantity;
    const currentAvailable = quantityResult[0].available;

    // คำนวณจำนวนที่เหลือหลังการยืม
    const newAvailable = currentAvailable - borrowCount;

    // ตรวจสอบว่าไม่สามารถยืมมากกว่าที่มีอยู่ได้
    if (newAvailable < 0) {
      return res.status(400).send("Not enough tools available for borrowing.");
    }

    // อัปเดตข้อมูล
    await conn.query(
      `UPDATE ${tb} SET available = ? WHERE id = ?`,
      [newAvailable, id]
    );

    res.status(200).send(`Borrowed ${borrowCount} units of tool ${id} successfully.`);
  } catch (err) {
    console.error(`Error Borrow ${tb}: ${err}`);
    res.status(500).send(`Error Borrow ${tb}`);
  }
});



module.exports = router;
