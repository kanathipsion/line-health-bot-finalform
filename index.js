const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const path = require('path'); // เพิ่มการ require โมดูล path

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

app.use(middleware(config));
app.use(express.json());

// เสิร์ฟหน้า form
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // เส้นทางไปยัง form.html
});

// Webhook สำหรับ LINE
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
