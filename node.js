const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Tạo thư mục lưu trữ ảnh nếu chưa có
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cấu hình Multer để lưu ảnh vào thư mục "uploads"
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     const name = req.body.name || "default"; // Lấy name từ form
//     console.log("Tên nhận được:", name);
//     cb(null, `image_${Date.now()}_${name}.jpg`);
//   },
// });

// const upload = multer({ storage });

const upload = multer({ storage: multer.memoryStorage() });

// // Route API để lưu ảnh
// app.post("/upload", upload.single("image"), (req, res) => {
//   res.json({ message: "Ảnh đã lưu!", imagePath: `/uploads/${req.file.filename}` });
// });
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Không có ảnh được tải lên!" });
  }

  const name = req.body.name || "default"; // Lấy name từ form
  console.log("Tên nhận được:", name);

  // Tạo đường dẫn lưu file
  const fileName = `image_${Date.now()}_${name.replace(/\s+/g, "_")}.jpg`;
  const filePath = path.join(__dirname, "uploads", fileName);

  // Lưu file từ bộ nhớ vào thư mục
  fs.writeFile(filePath, req.file.buffer, (err) => {
    if (err) {
      return res.status(500).json({ error: "Lỗi khi lưu file!" });
    }
    res.json({ message: "Ảnh đã lưu!", imagePath: `/uploads/${fileName}` });
  });
});
// Mở cổng server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));

// export default function testff({ id}){
//   return (
//     <h1>
//       {id}
//     </h1>
//   )
// }
