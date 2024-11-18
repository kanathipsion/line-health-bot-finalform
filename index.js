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

  // ตรวจสอบ stickerId และส่ง URL รูปภาพแทนสติกเกอร์
  if (stickerId === '110') { // สติกเกอร์สีเขียว
    messages.push({
      type: 'image',
      originalContentUrl: 'https://drive.google.com/uc?id=1neLxgykGoVpyPMWaofsqgtmauVHRvj5s',
      previewImageUrl: 'https://drive.google.com/uc?id=1neLxgykGoVpyPMWaofsqgtmauVHRvj5s'
    });
  } else if (stickerId === '111') { // สติกเกอร์สีเหลือง
    messages.push({
      type: 'image',
      originalContentUrl: 'https://drive.google.com/uc?id=1U41tRXROkj9v6lmHNKqAJ2vLyA3CUREi',
      previewImageUrl: 'https://drive.google.com/uc?id=1U41tRXROkj9v6lmHNKqAJ2vLyA3CUREi'
    });
  } else if (stickerId === '112') { // สติกเกอร์สีแดง
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

// API Endpoint สำหรับบันทึกข้อมูลลง Google Sheets
app.post('/save-to-sheet', (req, res) => {
  const { userId, sugarLevel, systolic, diastolic, bmi } = req.body;

  // ส่งข้อมูลไปยัง Apps Script
  axios
    .post(process.env.APPS_SCRIPT_URL, { userId, sugarLevel, systolic, diastolic, bmi })
    .then((response) => {
      console.log('Data saved successfully:', response.data);
      res.status(200).send('Data saved successfully!');
    })
    .catch((error) => {
      console.error('Error saving data:', error.response?.data || error.message);
      res.status(500).send('Error saving data');
    });
});

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Webhook สำหรับตอบข้อความจากผู้ใช้
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  const replyPromises = events.map((event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      if (userMessage === 'คำนวนผลสุขภาพ') {
        const formUrl = `https://${req.headers.host}/form?userId=${event.source.userId}`;
        const replyMessage = {
          type: 'text',
          text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
        };

        return replyMessageToUser(event.replyToken, replyMessage);
      }
    }
    return Promise.resolve(null);
  });

  Promise.all(replyPromises)
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันสำหรับตอบข้อความกลับไปยัง LINE
const replyMessageToUser = (replyToken, message) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };

  const body = {
    replyToken: replyToken,
    messages: [message],
  };

  return axios.post('https://api.line.me/v2/bot/message/reply', body, { headers });
};

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
