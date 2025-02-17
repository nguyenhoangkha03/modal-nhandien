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



// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors'); // Thêm dòng này
// const tf = require('@tensorflow/tfjs'); // Sử dụng @tensorflow/tfjs thay vì tfjs-node
// const faceapi = require('face-api.js');
// const canvas = require('canvas');
// const { Canvas, Image, ImageData, createCanvas } = canvas;

// // Monkey patch cho face-api.js với các đối tượng từ canvas
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// const app = express();
// app.use(cors()); // Cho phép CORS cho tất cả các nguồn

// const upload = multer();
// const uploadDir = path.join(__dirname, 'uploads');

// let knownFaces = [];
// let knownNames = [];

// // Hàm tải mô hình từ thư mục models (chạy trên Node.js)
// async function loadModels() {
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, 'models'));
//   await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, 'models'));
//   await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, 'models'));
//   console.log('Models loaded');
// }

// // Hàm xử lý ảnh từ thư mục uploads, trích xuất các khuôn mặt khác nhau
// async function extractDifferentFaces() {
//   const files = fs.readdirSync(uploadDir).filter(file => file.endsWith('.jpg'));
//   let descriptors = [];

//   for (const file of files) {
//     const imgPath = path.join(uploadDir, file);
//     const img = await canvas.loadImage(imgPath);
//     // Tạo canvas và vẽ ảnh lên canvas
//     const imgCanvas = createCanvas(img.width, img.height);
//     const ctx = imgCanvas.getContext('2d');
//     ctx.drawImage(img, 0, 0, img.width, img.height);

//     const detections = await faceapi.detectAllFaces(imgCanvas)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     detections.forEach(det => {
//       let isNewFace = true;
//       for (const knownFace of descriptors) {
//         if (faceapi.euclideanDistance(knownFace, det.descriptor) < 0.6) {
//           isNewFace = false;
//           break;
//         }
//       }
//       if (isNewFace) {
//         descriptors.push(det.descriptor);
//         knownFaces.push(det.descriptor);
//         // knownNames.push(file.replace('.jpg', ''));
//         const parts = file.split('_'); 
//         const label = parts[parts.length - 1].replace('.jpg', '');
//         knownNames.push(label);
//       }
//     });
//   }
//   console.log('Extracted different faces:', knownNames);
// }

// // Khởi tạo server và định nghĩa route /recognize
// async function startServer() {
//   app.post('/recognize', upload.single('image'), async (req, res) => {
//     if (!req.file) return res.status(400).send('No image uploaded');

//     const img = await canvas.loadImage(req.file.buffer);
//     // Tạo canvas và vẽ ảnh đã upload lên canvas
//     const imgCanvas = createCanvas(img.width, img.height);
//     const ctx = imgCanvas.getContext('2d');
//     ctx.drawImage(img, 0, 0, img.width, img.height);

//     const detections = await faceapi.detectAllFaces(imgCanvas)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     if (detections.length === 0) return res.status(404).send('No face detected');

//     let bestMatch = { name: 'unknown', distance: 1.0 };
//     detections.forEach(det => {
//       knownFaces.forEach((knownFace, i) => {
//         const distance = faceapi.euclideanDistance(knownFace, det.descriptor);
//         if (distance < bestMatch.distance) {
//           bestMatch = { name: knownNames[i], distance };
//         }
//       });
//     });
//     res.json({ match: bestMatch.name });
//   });

//   app.listen(5001, () => console.log('Server running on port 5001'));
// }

// (async () => {
//   await loadModels();
//   await extractDifferentFaces();
//   startServer();
// })();


// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');
// const tf = require('@tensorflow/tfjs');
// const faceapi = require('face-api.js');
// const canvas = require('canvas');
// const sharp = require('sharp');
// const { Canvas, Image, ImageData, createCanvas } = canvas;
// const http = require('http');
// const socketIO = require('socket.io');

// // Monkey patch cho face-api.js với các đối tượng từ canvas
// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// const app = express();
// app.use(cors());

// const uploadDir = path.join(__dirname, 'uploads');

// let knownFaces = [];
// let knownNames = [];

// // Hàm tải mô hình từ thư mục models (chạy trên Node.js)
// async function loadModels() {
//   await faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, 'models'));
//   await faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, 'models'));
//   await faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, 'models'));
//   console.log('✅ Models loaded');
// }

// // Hàm chuyển đổi ảnh sang PNG nếu lỗi
// async function convertToPng(imgPath) {
//   const outputPath = imgPath.replace(/\.(jpg|jpeg|webp|bmp|gif)$/i, '.png');
//   try {
//     await sharp(imgPath).toFormat('png').toFile(outputPath);
//     console.log(`🔄 Đã chuyển đổi sang PNG: ${outputPath}`);
//     return outputPath;
//   } catch (error) {
//     console.error(`❌ Lỗi chuyển đổi ảnh: ${imgPath}`, error);
//     return null;
//   }
// }

// // Hàm xử lý ảnh từ thư mục uploads, trích xuất các khuôn mặt khác nhau
// async function extractDifferentFaces() {
//   const files = fs.readdirSync(uploadDir).filter(file => file.match(/\.(jpg|jpeg|png)$/i));
//   let descriptors = [];

//   for (const file of files) {
//     const imgPath = path.join(uploadDir, file);
//     console.log(`🖼️ Đang xử lý ảnh: ${file}`);

//     let img;
//     try {
//       img = await canvas.loadImage(imgPath);
//     } catch (error) {
//       console.error(`❌ Lỗi khi tải ảnh: ${imgPath}`, error);
//       console.log(`🔄 Thử chuyển đổi ảnh sang PNG...`);

//       const convertedPath = await convertToPng(imgPath);
//       if (!convertedPath) {
//         console.error(`⛔ Không thể chuyển đổi ảnh: ${imgPath}`);
//         continue;
//       }

//       try {
//         img = await canvas.loadImage(convertedPath);
//       } catch (error) {
//         console.error(`❌ Lỗi khi tải ảnh sau khi chuyển đổi: ${convertedPath}`, error);
//         continue;
//       }
//     }

//     console.log(`✅ Ảnh hợp lệ: ${file}`);
//     const imgCanvas = createCanvas(img.width, img.height);
//     const ctx = imgCanvas.getContext('2d');
//     ctx.drawImage(img, 0, 0, img.width, img.height);

//     const detections = await faceapi.detectAllFaces(imgCanvas)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     detections.forEach(det => {
//       let isNewFace = true;
//       for (const knownFace of descriptors) {
//         if (faceapi.euclideanDistance(knownFace, det.descriptor) < 0.6) {
//           isNewFace = false;
//           break;
//         }
//       }
//       if (isNewFace) {
//         descriptors.push(det.descriptor);
//         knownFaces.push(det.descriptor);

//         const parts = file.split('_');
//         const label = parts[parts.length - 1].replace(/\.(jpg|jpeg|png)$/, '');
//         knownNames.push(label);
//       }
//     });

//     console.log(`🎭 Số khuôn mặt phát hiện trong ${file}: ${detections.length}`);
//   }
//   console.log('✅ Kết quả nhận diện:', knownNames);
// }

// const server = http.createServer(app);
// const io = socketIO(server, { cors: { origin: '*' } });

// io.on('connection', socket => {
//   console.log('Client connected');

//   socket.on('image', async (data) => {
//     try {
//       const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
//       const imgBuffer = Buffer.from(base64Data, 'base64');
//       const img = await canvas.loadImage(imgBuffer);
//       const imgCanvas = createCanvas(img.width, img.height);
//       const ctx = imgCanvas.getContext('2d');
//       ctx.drawImage(img, 0, 0, img.width, img.height);

//       const detections = await faceapi.detectAllFaces(imgCanvas)
//         .withFaceLandmarks()
//         .withFaceDescriptors();

//       if (detections.length === 0) {
//         socket.emit('result', { match: 'No face detected' });
//         return;
//       }

//       let bestMatch = { name: 'unknown', distance: 1.0 };
//       detections.forEach(det => {
//         knownFaces.forEach((knownFace, i) => {
//           const distance = faceapi.euclideanDistance(knownFace, det.descriptor);
//           if (distance < bestMatch.distance) {
//             bestMatch = { name: knownNames[i], distance };
//           }
//         });
//       });

//       socket.emit('result', { match: bestMatch.name });
//     } catch (error) {
//       console.error('Error processing image:', error);
//       socket.emit('result', { match: 'Error processing image' });
//     }
//   });

//   socket.on('disconnect', () => {
//     console.log('Client disconnected');
//   });
// });

// (async () => {
//   await loadModels();
//   await extractDifferentFaces();
//   server.listen(5001, () => console.log('🚀 Server running on port 5001'));
// })();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const tf = require('@tensorflow/tfjs'); // Sử dụng tfjs thuần
const faceapi = require('face-api.js');
const canvas = require('canvas');
const sharp = require('sharp');
const { Canvas, Image, ImageData, createCanvas } = canvas;
const http = require('http');
const socketIO = require('socket.io');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const app = express();
app.use(cors());

const uploadDir = path.join(__dirname, 'uploads');

let knownFaces = [];
let knownNames = [];
let modelsLoaded = false;

async function loadModels() {
  const modelPath = path.join(__dirname, 'models');
  if (!modelsLoaded) {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    modelsLoaded = true;
    console.log('✅ Models loaded (using @tensorflow/tfjs)');
  }
}

// Hàm xử lý ảnh từ thư mục upload chỉ được chạy một lần khi khởi động server
async function extractDifferentFaces() {
  const files = fs.readdirSync(uploadDir).filter(file => file.match(/\.(jpg|jpeg|png)$/i));

  for (const file of files) {
    const imgPath = path.join(uploadDir, file);
    console.log(`🖼️ Đang xử lý ảnh: ${file}`);

    let img;
    try {
      img = await canvas.loadImage(imgPath);
    } catch (error) {
      console.error(`❌ Lỗi khi tải ảnh: ${imgPath}`, error);
      continue;
    }

    const imgCanvas = createCanvas(img.width, img.height);
    const ctx = imgCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    const detections = await faceapi.detectAllFaces(imgCanvas)
      .withFaceLandmarks()
      .withFaceDescriptors();

    detections.forEach(det => {
      const label = file.replace(/^.*_([^_]+)\.(jpg|jpeg|png)$/i, '$1');
      let isNewFace = true;

      for (let i = 0; i < knownFaces.length; i++) {
        if (faceapi.euclideanDistance(knownFaces[i], det.descriptor) < 0.3) {
          isNewFace = false;
          break;
        }
      }

      if (isNewFace) {
        knownFaces.push(det.descriptor);
        if (!knownNames.includes(label)) {
          knownNames.push(label);
        }
        console.log(`🆕 Phát hiện khuôn mặt mới: ${label}`);
      }
    });

    console.log(`🎭 Số khuôn mặt phát hiện trong ${file}: ${detections.length}`);
  }

  console.log('✅ Kết quả nhận diện:', knownNames);
}

// Chỉ tải model và khuôn mặt một lần khi khởi động server
(async () => {
  await loadModels();
  await extractDifferentFaces();
  const server = http.createServer(app);
  const io = socketIO(server, { cors: { origin: '*' } });

  io.on('connection', socket => {
    console.log('Client connected');

    // Khi nhận được dữ liệu ảnh qua socket, ta mong đợi dữ liệu ở dạng object có 2 trường: image (base64) và label (tên, vd: "giang")
    // socket.on('image', async (data) => {
    //   try {
    //     // Không cần gọi lại loadModels() vì đã được tải trước đó
    //     let imageData, providedLabel;
    //     if (typeof data === 'string') {
    //       imageData = data;
    //       providedLabel = null;
    //     } else {
    //       imageData = data.image;
    //       providedLabel = data.label;
    //     }

    //     const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    //     const imgBuffer = Buffer.from(base64Data, 'base64');
    //     const img = await canvas.loadImage(imgBuffer);
    //     const imgCanvas = createCanvas(img.width, img.height);
    //     const ctx = imgCanvas.getContext('2d');
    //     ctx.drawImage(img, 0, 0, img.width, img.height);

    //     const detections = await faceapi.detectAllFaces(imgCanvas)
    //       .withFaceLandmarks()
    //       .withFaceDescriptors();

    //     if (detections.length === 0) {
    //       socket.emit('result', { match: 'No face detected' });
    //       return;
    //     }

    //     // Xử lý khuôn mặt đầu tiên
    //     const detection = detections[0];
    //     let bestMatch = { name: 'unknown', distance: 1.0 };
    //     knownFaces.forEach((knownFace, i) => {
    //       const distance = faceapi.euclideanDistance(knownFace, detection.descriptor);
    //       if (distance < bestMatch.distance) {
    //         bestMatch = { name: knownNames[i], distance };
    //       }
    //     });

    //     if (bestMatch.distance < 0.6) {
    //       console.log(`✅ Nhận diện thành công: ${bestMatch.name}`);
    //       socket.emit('result', { match: bestMatch.name });
    //     } else {
    //       // Nếu không nhận diện được, thêm khuôn mặt mới vào model nếu có label được cung cấp
    //       if (providedLabel) {
    //         knownFaces.push(detection.descriptor);
    //         if (!knownNames.includes(providedLabel)) {
    //           knownNames.push(providedLabel);
    //         }
    //         console.log(`🆕 Thêm khuôn mặt mới: ${providedLabel}`);
    //         socket.emit('result', { match: providedLabel });
    //       } else {
    //         console.log('❓ Khuôn mặt mới không được nhận diện và không có label kèm theo.');
    //         socket.emit('result', { match: 'unknown' });
    //       }
    //     }
    //   } catch (error) {
    //     console.error('Error processing image:', error);
    //     socket.emit('result', { match: 'Error processing image' });
    //   }
    // });

    
    socket.on('image', async (data) => {
      try {
        let imageData, providedLabel;
        if (typeof data === 'string') {
          imageData = data;
          providedLabel = null;
        } else {
          imageData = data.image;
          providedLabel = data.label;
        }
    
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const imgBuffer = Buffer.from(base64Data, 'base64');
        const img = await canvas.loadImage(imgBuffer);
        const imgCanvas = createCanvas(img.width, img.height);
        const ctx = imgCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
    
        const detections = await faceapi.detectAllFaces(imgCanvas)
          .withFaceLandmarks()
          .withFaceDescriptors();
    
        if (detections.length === 0) {
          socket.emit('result', { match: 'No face detected' });
          socket.emit('deleteImage'); // Yêu cầu client xóa ảnh và gửi ảnh mới
          return;
        }
    
        const detection = detections[0];
        let bestMatch = { name: 'unknown', distance: 1.0 };
        knownFaces.forEach((knownFace, i) => {
          const distance = faceapi.euclideanDistance(knownFace, detection.descriptor);
          if (distance < bestMatch.distance) {
            bestMatch = { name: knownNames[i], distance };
          }
        });
    
        if (bestMatch.distance < 0.6) {
          console.log(`✅ Nhận diện thành công: ${bestMatch.name}`);
          socket.emit('result', { match: bestMatch.name });
        } else {
          if (providedLabel) {
            knownFaces.push(detection.descriptor);
            if (!knownNames.includes(providedLabel)) {
              knownNames.push(providedLabel);
            }
            console.log(`🆕 Thêm khuôn mặt mới: ${providedLabel}`);
            socket.emit('result', { match: providedLabel });
          } else {
            console.log('❓ Khuôn mặt mới không được nhận diện và không có label kèm theo.');
            socket.emit('result', { match: 'unknown' });
          }
        }
    
        // Yêu cầu client xóa ảnh để tiếp tục nhận diện ảnh mới
        socket.emit('deleteImage');
    
      } catch (error) {
        console.error('Error processing image:', error);
        socket.emit('result', { match: 'Error processing image' });
        socket.emit('deleteImage'); // Xóa ảnh dù có lỗi xảy ra
      }
    });
    

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  server.listen(5001, () => console.log('🚀 Server running on port 5001'));
})();

