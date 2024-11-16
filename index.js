const express = require('express');
const { middleware } = require('@line/bot-sdk');
const path = require('path');
const axios = require('axios');

const app = express();

// Configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Middleware สำหรับ LINE webhook
app.use(middleware(config));

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // เส้นทางไปยัง form.html
});

// Endpoint สำหรับส่งข้อความจากฟอร์มกลับไปยัง LINE
app.post('/send-message', (req, res) => {
  const { userId, message, packageId, stickerId } = req.body;

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
    .then(() => res.status(200).send('Message sent successfully'))
    .catch((err) => {
      console.error('Error sending message:', err.response?.data || err.message);
      res.status(500).send('Error sending message');
    });
});

// Webhook สำหรับรับข้อความจากผู้ใช้
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชัน handleEvent สำหรับตอบกลับผู้ใช้
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // ตรวจสอบว่าข้อความที่ผู้ใช้พิมพ์คือ "คำนวนผลสุขภาพ"
    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
      };

      return client.replyMessage(event.replyToken, replyMessage);
    }
  }

  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
