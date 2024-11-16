const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);

// Webhook Route
app.post('/webhook', (req, res) => {
  console.log('Webhook called'); // Log Webhook
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error('Error:', err); // Log Error
      res.status(500).end();
    });
});

// Handle Event Function
function handleEvent(event) {
  console.log('Received event:', event); // Log Event
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;
    console.log('User message:', userMessage); // Log User Message

    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
      };

      return client.replyMessage(event.replyToken, replyMessage);
    }
  }

  return Promise.resolve(null); // Do nothing if it's not the specified message
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
