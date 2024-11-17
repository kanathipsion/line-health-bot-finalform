const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
const path = require('path');
require('dotenv').config(); // โหลด environment variables จากไฟล์ .env

const app = express();
app.use(express.json());

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Middleware สำหรับ LINE webhook
app.use('/webhook', middleware(config));

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
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

// ฟังก์ชันส่งข้อมูลไปยัง Google Sheets
function sendDataToGoogleSheet(data) {
  const googleScriptUrl = process.env.GOOGLE_SCRIPT_URL;

  axios.post(googleScriptUrl, data)
    .then(response => {
      console.log('Data sent to Google Sheets:', response.data);
    })
    .catch(error => {
      console.error('Error sending data to Google Sheets:', error.message);
    });
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
