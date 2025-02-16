// const express = require("express");
// const multer = require("multer");
// const fs = require("fs");
// const path = require("path");
// const faceapi = require("face-api.js");
// const canvas = require("canvas");

// const app = express();
// const upload = multer({ dest: "uploads/" });
// const cors = require("cors");
// app.use(cors());

// const { Canvas, Image } = canvas;
// faceapi.env.monkeyPatch({ Canvas, Image });

// const IMAGES_FOLDER = path.join(__dirname, "uploads");
// let faceMatcher;

// // Route mặc định để tránh lỗi "Cannot GET /"
// app.get("/", (req, res) => {
//   res.send("Face Recognition API is running!");
// });

// // 📌 Load mô hình nhận diện
// const loadModels = async () => {
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
//   await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, "models"));
//   await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, "models"));
//   await loadLabeledImages();
// };

// // 📌 Đọc và mã hóa ảnh trong folder "uploads"
// const loadLabeledImages = async () => {
//   const labels = fs.readdirSync(IMAGES_FOLDER);
//   const labeledDescriptors = [];

//   for (const label of labels) {
//     const imgPath = path.join(IMAGES_FOLDER, label);
//     const img = await canvas.loadImage(imgPath);
//     const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

//     if (detections) {
//       // labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label.split("_").slice(2).join("_"), [detections.descriptor]));
//       const name = label.replace(/^image_\d+_/, "").replace(/\.\w+$/, "");
//       labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(name, [detections.descriptor]));
//     }
//   }

//   if (labeledDescriptors.length > 0) {
//     faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
//     console.log("Đã tải xong khuôn mặt mẫu");
//   } else {
//     console.log("Không có dữ liệu khuôn mặt nào được tải!");
//   }
// };

// // 📌 API Nhận diện khuôn mặt từ ảnh upload
// app.post("/detect-face", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "Không có ảnh được tải lên!" });
//     }

//     const imgPath = req.file.path;
//     const img = await canvas.loadImage(imgPath);
//     const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

//     if (!detections) {
//       return res.json({ name: "Unknown" });
//     }

//     if (!faceMatcher) {
//       return res.json({ name: "No face data available" });
//     }

//     const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
//     res.json({ name: bestMatch.toString() });
//   } catch (error) {
//     console.error("Lỗi khi nhận diện khuôn mặt:", error);
//     res.status(500).json({ error: "Lỗi server!" });
//   }
// });

// // 📌 Khởi động server
// loadModels().then(() => {
//   app.listen(5001, () => console.log("Server is running on port 5001"));
// });
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const faceapi = require("face-api.js");
const canvas = require("canvas");
const express = require("express");

const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image });

const IMAGES_FOLDER = path.join(__dirname, "uploads");
let faceMatcher = null;

// 📌 Khởi tạo WebSocket server
const wss = new WebSocket.Server({ port: 5001 });

console.log("🚀 WebSocket server đang chạy trên cổng 5001...");

// 📌 Tải mô hình nhận diện
const loadModels = async () => {
  console.log("📥 Đang tải mô hình nhận diện...");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, "models"));
  await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, "models"));
  await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, "models"));
  console.log("✅ Mô hình đã được tải xong!");
  await loadLabeledImages();
};

const loadLabeledImages = async () => {
  console.log("📥 Đang tải ảnh khuôn mặt từ thư mục 'uploads'...");
  const labels = fs.readdirSync(IMAGES_FOLDER);
  const labeledDescriptors = [];

  for (const label of labels) {
    try {
      const imgPath = path.join(IMAGES_FOLDER, label);
      const img = await canvas.loadImage(imgPath);
      const detections = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detections) {
        const name = label.replace(/^image_\d+_/, "").replace(/\.\w+$/, "");
        labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(name, [detections.descriptor]));
        console.log(`✅ Đã tải: ${label}`);
      } else {
        console.log(`⚠ Không tìm thấy khuôn mặt trong ảnh: ${label}`);
      }
    } catch (error) {
      console.log(`❌ Lỗi khi tải ảnh ${label}:`, error.message);
    }
  }

  if (labeledDescriptors.length > 0) {
    faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.4);
    console.log("✅ Tất cả ảnh khuôn mặt đã được tải xong!");
  } else {
    console.log("⚠ Không có dữ liệu khuôn mặt nào được tải!");
  }
};

// 📌 Theo dõi thư mục `uploads` để tự động cập nhật dữ liệu khuôn mặt
fs.watch(IMAGES_FOLDER, (eventType, filename) => {
  if (filename) {
    console.log(`📂 Phát hiện thay đổi trong thư mục uploads: ${filename}`);
    loadLabeledImages();
  }
});

// 📌 Xử lý kết nối WebSocket
wss.on("connection", (ws) => {
  console.log("📡 Client đã kết nối.");

  ws.on("message", async (message) => {
    try {
      console.log("📸 Nhận ảnh từ client...");
      const img = await canvas.loadImage(Buffer.from(message));
      const detections = await faceapi.detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
  
      if (!detections) {
        console.log("⚠ Không tìm thấy khuôn mặt.");
        ws.send(JSON.stringify({ name: "Unknown", distance: null }));
        return;
      }
  
      if (!faceMatcher || faceMatcher.labeledDescriptors.length === 0) {
        console.log("⚠ Chưa có dữ liệu khuôn mặt.");
        ws.send(JSON.stringify({ name: "Unknown", distance: null }));
        return;
      }
  
      // 📌 So khớp khuôn mặt
      const bestMatch = faceMatcher.findBestMatch(detections.descriptor);

      if (bestMatch.label === "unknown") {
        console.log("❌ Nhận diện thất bại: Khuôn mặt không khớp với dữ liệu nào.");
      } else {
        console.log("✅ Nhận diện thành công:", bestMatch.toString());
      }
      
  
      // 📌 Tìm lại tên gốc từ file ảnh đã lưu
      const matchedDescriptor = faceMatcher.labeledDescriptors.find(ld => ld.label === bestMatch.label);
      const filename = matchedDescriptor ? matchedDescriptor.label.replace(/\.\w+$/, "") : "Unknown";
  
      console.log(`🎉 Khuôn mặt được nhận diện là: ${filename}`);
  
      ws.send(JSON.stringify({
        name: filename,
        distance: bestMatch.distance
      }));
    } catch (error) {
      console.error("❌ Lỗi khi xử lý ảnh:", error);
      ws.send(JSON.stringify({ error: "Lỗi server!" }));
    }
  });
  

  ws.on("close", () => {
    console.log("❌ Client đã ngắt kết nối.");
  });
});

// 📌 Khởi chạy server và tải mô hình
loadModels();
