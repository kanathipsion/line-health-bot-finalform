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
  const userId = req.query.userId; // ดึง userId จาก query string
  if (!userId) {
    return res.status(400).send('Missing userId'); // หากไม่มี userId ให้แสดงข้อผิดพลาด
  }

  res.sendFile(path.join(__dirname, 'form.html')); // ส่งไฟล์ form.html กลับไปยังผู้ใช้
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

// ฟังก์ชันเพื่อจัดการข้อความจากผู้ใช้
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // ตรวจสอบว่าข้อความที่ผู้ใช้พิมพ์คือ "คำนวนผลสุขภาพ"
    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`; // URL ของฟอร์ม
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
      };

      return client.replyMessage(event.replyToken, replyMessage);
    } else {
      // กรณีข้อความไม่ตรงกับ "คำนวนผลสุขภาพ"
      const replyMessage = {
        type: 'text',
        text: 'ขอโทษครับ ไม่เข้าใจข้อความของคุณ ลองพิมพ์ "คำนวนผลสุขภาพ" เพื่อเริ่มต้น',
      };

      return client.replyMessage(event.replyToken, replyMessage);
    }
  }

  // ไม่ตอบกลับเหตุการณ์อื่น ๆ
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
