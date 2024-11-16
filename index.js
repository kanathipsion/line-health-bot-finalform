const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');
const path = require('path');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Middleware สำหรับ LINE webhook
app.post('/webhook', middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// เส้นทางหลัก (Route for "/")
app.get('/', (req, res) => {
  res.send('Welcome to the LINE Bot Health Check Application!');
});

// รับข้อมูลจากฟอร์มและส่งผลกลับไปที่ LINE
app.post('/submit', express.urlencoded({ extended: true }), (req, res) => {
  const { userId, sugar, pressure, height, weight } = req.body;

  // คำนวณ BMI
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
  let healthStatus = '';
  if (bmi < 18.5) healthStatus = 'น้ำหนักน้อยกว่ามาตรฐาน';
  else if (bmi < 25) healthStatus = 'น้ำหนักปกติ';
  else if (bmi < 30) healthStatus = 'น้ำหนักเกิน';
  else healthStatus = 'อ้วน';

  // ส่งข้อมูลไปยัง Google Sheets
  const data = { userId, sugar, pressure, height, weight, bmi };
  axios
    .post(process.env.GOOGLE_SCRIPT_URL, data)
    .then(() => console.log('Data saved to Google Sheets'))
    .catch((err) => console.error('Error saving to Google Sheets:', err));

  // ส่งข้อความและ Sticker กลับไปยัง LINE
  const replyMessages = [
    {
      type: 'text',
      text: `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi} (${healthStatus})`,
    },
    {
      type: 'sticker',
      packageId: '1', // ตัวอย่าง Sticker
      stickerId: '13', // ตัวอย่าง Sticker
    },
  ];

  client
    .pushMessage(userId, replyMessages)
    .then(() => res.send('ข้อมูลถูกบันทึกแล้ว!'))
    .catch((err) => {
      console.error(err);
      res.status(500).send('เกิดข้อผิดพลาด');
    });
});

// ฟังก์ชันจัดการข้อความจากผู้ใช้
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    // ถ้าผู้ใช้พิมพ์ "คำนวนผลสุขภาพ"
    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
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
