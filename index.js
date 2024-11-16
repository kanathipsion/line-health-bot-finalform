const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json()); // ใช้ body-parser เพื่ออ่านข้อมูล JSON ใน POST request

// LINE Configuration
const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN; // Token จาก Config Vars ใน Heroku

// Route สำหรับรับข้อมูลและส่ง Flex Message
app.post('/send-message', (req, res) => {
  const { userId, flexMessage } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
  };

  const body = {
    to: userId,
    messages: [
      {
        type: 'flex',
        altText: 'ผลลัพธ์สุขภาพของคุณ',
        contents: flexMessage,
      },
    ],
  };

  axios
    .post('https://api.line.me/v2/bot/message/push', body, { headers })
    .then(() => {
      console.log('Flex Message sent successfully!');
      res.status(200).send('Flex Message sent successfully!');
    })
    .catch((err) => {
      console.error('Error sending Flex Message:', err.response?.data || err.message);
      res.status(500).send('Error sending Flex Message');
    });
});

// เริ่มต้นเซิร์ฟเวอร์
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
