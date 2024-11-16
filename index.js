const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { middleware } = require('@line/bot-sdk');

const app = express();
app.use(bodyParser.json());

// LINE Configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Middleware สำหรับ Webhook
app.use('/webhook', middleware(config));

// Endpoint สำหรับ Webhook
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  if (!Array.isArray(events)) {
    return res.status(500).end();
  }

  Promise.all(
    events.map((event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        // ตอบกลับข้อความที่ได้รับ
        return handleTextMessage(event);
      }
    })
  )
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันจัดการข้อความ
function handleTextMessage(event) {
  const replyMessage = {
    type: 'text',
    text: `คุณส่งข้อความว่า: ${event.message.text}`,
  };

  return axios.post(
    'https://api.line.me/v2/bot/message/reply',
    {
      replyToken: event.replyToken,
      messages: [replyMessage],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

// Route สำหรับส่ง Flex Message (จากฟอร์ม)
app.post('/send-message', (req, res) => {
  const { userId, flexMessage } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
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
