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
  console.log('Webhook called');
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => {
      console.log('Result:', result);
      res.json(result);
    })
    .catch((err) => {
      console.error('Error handling event:', err);
      res.status(500).end();
    });
});

// Handle Event Function
function handleEvent(event) {
  console.log('Received event:', JSON.stringify(event, null, 2));

  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
      };

      return client.replyMessage(event.replyToken, replyMessage)
        .then(() => console.log('Message sent successfully'))
        .catch((err) => console.error('Error sending message:', err));
    }
  }

  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
