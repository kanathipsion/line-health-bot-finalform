const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // เสิร์ฟไฟล์ static เช่น form.html

// API Endpoint สำหรับส่งข้อความและสติกเกอร์/รูปภาพไปยังผู้ใช้
app.post('/send-message', (req, res) => {
  const { userId, message, packageId, stickerId } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, // ใช้ Access Token จาก Config Vars
  };

  let messages = [
    { type: 'text', text: message },
  ];

  // ตรวจสอบสติกเกอร์และแทนที่ด้วยรูปภาพตามสีที่ระบุ
  if (stickerId === '110') { // สีเขียว
    messages.push({
      type: 'image',
      originalContentUrl: 'https://drive.google.com/uc?id=1neLxgykGoVpyPMWaofsqgtmauVHRvj5s',
      previewImageUrl: 'https://drive.google.com/uc?id=1neLxgykGoVpyPMWaofsqgtmauVHRvj5s'
    });
  } else if (stickerId === '111') { // สีเหลือง
    messages.push({
      type: 'image',
      originalContentUrl: 'https://drive.google.com/uc?id=1U41tRXROkj9v6lmHNKqAJ2vLyA3CUREi',
      previewImageUrl: 'https://drive.google.com/uc?id=1U41tRXROkj9v6lmHNKqAJ2vLyA3CUREi'
    });
  } else if (stickerId === '112') { // สีแดง
    messages.push({
      type: 'image',
      originalContentUrl: 'https://drive.google.com/uc?id=1Z9YF0VVLF8EVnKHDu9LxVnmAojAVZrd-',
      previewImageUrl: 'https://drive.google.com/uc?id=1Z9YF0VVLF8EVnKHDu9LxVnmAojAVZrd-'
    });
  } else {
    messages.push({ type: 'sticker', packageId, stickerId });
  }

  const body = {
    to: userId,
    messages: messages,
  };

  axios
    .post('https://api.line.me/v2/bot/message/push', body, { headers })
    .then(() => {
      console.log('Message sent successfully!');
      res.status(200).send('Message sent successfully!');
    })
    .catch((err) => {
      console.error('Error sending message:', err.response?.data || err.message);
      res.status(500).send('Error sending message');
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
