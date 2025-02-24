// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const cors = require('cors');
// const tf = require('@tensorflow/tfjs'); // Sử dụng tfjs thuần
// const faceapi = require('face-api.js');
// const canvas = require('canvas');
// const sharp = require('sharp');
// const { Canvas, Image, ImageData, createCanvas } = canvas;
// const http = require('http');
// const socketIO = require('socket.io');

// faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// const app = express();
// app.use(cors());

// const uploadDir = path.join(__dirname, 'uploads');

// let knownFaces = [];
// let knownNames = [];
// let modelsLoaded = false;

// async function loadModels() {
//   const modelPath = path.join(__dirname, 'models');
//   if (!modelsLoaded) {
//     await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
//     await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
//     await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
//     modelsLoaded = true;
//     console.log('✅ Models loaded (using @tensorflow/tfjs)');
//   }
// }

// // Hàm xử lý ảnh từ thư mục upload chỉ được chạy một lần khi khởi động server
// async function extractDifferentFaces() {
//   const files = fs.readdirSync(uploadDir).filter(file => file.match(/\.(jpg|jpeg|png)$/i));

//   for (const file of files) {
//     const imgPath = path.join(uploadDir, file);
//     console.log(`🖼️ Đang xử lý ảnh: ${file}`);

//     let img;
//     try {
//       img = await canvas.loadImage(imgPath);
//     } catch (error) {
//       console.error(`❌ Lỗi khi tải ảnh: ${imgPath}`, error);
//       continue;
//     }

//     const imgCanvas = createCanvas(img.width, img.height);
//     const ctx = imgCanvas.getContext('2d');
//     ctx.drawImage(img, 0, 0, img.width, img.height);

//     const detections = await faceapi.detectAllFaces(imgCanvas)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     detections.forEach(det => {
      
//       const label = file.replace(/^.*_([^_]+)\.(jpg|jpeg|png)$/i, '$1');
//       let isNewFace = true;

//       for (let i = 0; i < knownFaces.length; i++) {
//         if (faceapi.euclideanDistance(knownFaces[i], det.descriptor) < 0.3) {
//           isNewFace = false;
//           break;
//         }
//       }

//       if (isNewFace) {
//         knownFaces.push(det.descriptor);
//         if (!knownNames.includes(label)) {
//           knownNames.push(label);
//         }
//         console.log(`🆕 Phát hiện khuôn mặt mới: ${label}`);
//       }
//     });

//     console.log(`🎭 Số khuôn mặt phát hiện trong ${file}: ${detections.length}`);
//   }

//   console.log('✅ Kết quả nhận diện:', knownNames);
// }

// // Chỉ tải model và khuôn mặt một lần khi khởi động server
// (async () => {
//   await loadModels();
//   await extractDifferentFaces();
//   const server = http.createServer(app);
//   const io = socketIO(server, { cors: { origin: '*' } });

//   io.on('connection', socket => {
//     console.log('Client connected');
//     socket.on('image', async (data) => {
//       try {
//         let imageData, providedLabel;
//         if (typeof data === 'string') {
//           imageData = data;
//           providedLabel = null;
//         } else {
//           imageData = data.image;
//           providedLabel = data.label;
//         }
    
//         const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
//         const imgBuffer = Buffer.from(base64Data, 'base64');
//         const img = await canvas.loadImage(imgBuffer);
//         const imgCanvas = createCanvas(img.width, img.height);
//         const ctx = imgCanvas.getContext('2d');
//         ctx.drawImage(img, 0, 0, img.width, img.height);
    
//         const detections = await faceapi.detectAllFaces(imgCanvas)
//           .withFaceLandmarks()
//           .withFaceDescriptors();
    
//         if (detections.length === 0) {
//           socket.emit('result', { match: 'No face detected' });
//           socket.emit('deleteImage'); // Yêu cầu client xóa ảnh và gửi ảnh mới
//           return;
//         }
    
//         const detection = detections[0];
//         let bestMatch = { name: 'unknown', distance: 1.0 };
//         knownFaces.forEach((knownFace, i) => {
//           const distance = faceapi.euclideanDistance(knownFace, detection.descriptor);
//           if (distance < bestMatch.distance) {
//             bestMatch = { name: knownNames[i], distance };
//           }
//         });
    
//         if (bestMatch.distance < 0.6) {
//           console.log(`✅ Nhận diện thành công: ${bestMatch.name}`);
//           socket.emit('result', { match: bestMatch.name });
//         } else {
//           if (providedLabel) {
//             knownFaces.push(detection.descriptor);
//             if (!knownNames.includes(providedLabel)) {
//               knownNames.push(providedLabel);
//             }
//             console.log(`🆕 Thêm khuôn mặt mới: ${providedLabel}`);
//             socket.emit('result', { match: providedLabel });
//           } else {
//             console.log('❓ Khuôn mặt mới không được nhận diện và không có label kèm theo.');
//             socket.emit('result', { match: 'unknown' });
//           }
//         }
    
//         // Yêu cầu client xóa ảnh để tiếp tục nhận diện ảnh mới
//         socket.emit('deleteImage');
    
//       } catch (error) {
//         console.error('Error processing image:', error);
//         socket.emit('result', { match: 'Error processing image' });
//         socket.emit('deleteImage'); // Xóa ảnh dù có lỗi xảy ra
//       }
//     });
    

//     socket.on('disconnect', () => {
//       console.log('Client disconnected');
//     });
//   });

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
  const prefaces = [];

  io.on('connection', socket => {
    console.log('Client connected');
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

        const times = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
    
        if (bestMatch.distance < 0.6) {
          if(prefaces.find(preface => preface === bestMatch.name)){
            console.log(`✅ Nhận diện thành công: ${bestMatch.name}`);
            socket.emit('result', { match: "Đã điểm danh rồi", time: times });
          }else {
            console.log(`✅ Nhận diện thành công: ${bestMatch.name}`);
            socket.emit('result', { match: bestMatch.name, time: times });
            prefaces.push(bestMatch.name);
          }
        } else {
          if (providedLabel) {
            knownFaces.push(detection.descriptor);
            if (!knownNames.includes(providedLabel)) {
              knownNames.push(providedLabel);
            }
            console.log(`🆕 Thêm khuôn mặt mới: ${providedLabel}`);
            socket.emit('result', { match: providedLabel, time: times });
          } else {
            console.log('❓ Khuôn mặt mới không được nhận diện và không có label kèm theo.');
            socket.emit('result', { match: 'unknown', time: times });
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

