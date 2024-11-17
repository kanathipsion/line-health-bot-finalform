const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const bodyParser = require('body-parser');

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const app = express();

// LINE middleware ต้องมาก่อน body-parser
app.use(middleware(config));

// Body parser สำหรับ endpoint อื่น ๆ
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Webhook to handle messages from LINE
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Example handler for LINE Bot events
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const replyMessage = { type: 'text', text: `คุณพิมพ์ว่า: ${event.message.text}` };
    return client.replyMessage(event.replyToken, replyMessage);
  }
  return Promise.resolve(null);
}

// Endpoint to serve the form
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
