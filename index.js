const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const path = require('path'); // เพิ่ม path module

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// ใช้ middleware ของ LINE เฉพาะที่จำเป็น
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// เสิร์ฟหน้า form
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // ส่งไฟล์ form.html
});

// ฟังก์ชันสำหรับจัดการข้อความจากผู้ใช้
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const replyMessage = {
      type: 'text',
      text: 'กรุณากรอกข้อมูลสุขภาพของคุณในลิงก์นี้: https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=' + event.source.userId,
    };

    return client.replyMessage(event.replyToken, replyMessage);
  }
  return Promise.resolve(null);
}

// Start Server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
