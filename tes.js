let file = "image_2_24_2025__10_24_58_AM_217060166";
let regex = /^image_(\d+_\d+_\d+)__(\d+_\d+_\d+_[A-Za-z]+)_(\d+)$/;
let matches = file.match(regex);
const mssv = matches[3]; 
const times = matches[2];
const days = matches[1];

console.log("MSSV: " + mssv);
console.log("Times: " + times);
console.log("Days: " + days);