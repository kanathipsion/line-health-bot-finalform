const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // เสิร์ฟไฟล์ static เช่น form.html

// API Endpoint สำหรับส่งข้อความและสติกเกอร์ไปยังผู้ใช้
app.post('/send-message', (req, res) => {
  const { userId, message, packageId, stickerId } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, // ใช้ Access Token จาก Config Vars
  };

  const body = {
    to: userId,
    messages: [
      { type: 'text', text: message },
      { type: 'sticker', packageId, stickerId },
    ],
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

// ฟังก์ชันสำหรับส่งข้อความและสติกเกอร์จากฟอร์ม
app.post('/submit', (req, res) => {
  const { userId, sugar, pressure, height, weight } = req.body;

  // คำนวณ BMI
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
  let healthStatus = '';

  // ตรวจสอบสถานะสุขภาพ
  if (bmi < 18.5) {
    healthStatus = 'น้ำหนักน้อย';
  } else if (bmi >= 18.5 && bmi < 24.9) {
    healthStatus = 'สุขภาพดี';
  } else if (bmi >= 25 && bmi < 29.9) {
    healthStatus = 'น้ำหนักเกิน';
  } else {
    healthStatus = 'อ้วน';
  }

  const message = `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi} (${healthStatus})`;
  const packageId = '1';
  const stickerId = bmi >= 30 ? '8' : '4'; // Sticker ตามสถานะสุขภาพ

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };

  const body = {
    to: userId,
    messages: [
      { type: 'text', text: message },
      { type: 'sticker', packageId, stickerId },
    ],
  };

  axios
    .post('https://api.line.me/v2/bot/message/push', body, { headers })
    .then(() => {
      console.log('Health summary sent successfully!');
      res.status(200).send('Health summary sent successfully!');
    })
    .catch((err) => {
      console.error('Error sending health summary:', err.response?.data || err.message);
      res.status(500).send('Error sending health summary');
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
