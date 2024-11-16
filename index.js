const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const path = require('path');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN, // ใส่ Access Token ที่ถูกต้อง
  channelSecret: process.env.LINE_CHANNEL_SECRET, // ใส่ Secret ที่ถูกต้อง
};
const client = new Client(config);

// Middleware สำหรับ LINE webhook
app.use(middleware(config));

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // เส้นทางไปยังไฟล์ form.html
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

// ฟังก์ชันจัดการข้อความจากผู้ใช้
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // ถ้าผู้ใช้พิมพ์ "คำนวนผลสุขภาพ"
    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://<app-name>.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณที่ลิงก์นี้: ${formUrl}`,
      };

      return client.replyMessage(event.replyToken, replyMessage);
    }
  }

  // ถ้าข้อความไม่ตรงเงื่อนไข จะไม่ตอบกลับ
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
