const express = require('express');
const { Client, middleware } = require('@line/bot-sdk');
const path = require('path');

const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9mAZkFBPqOGyFdxRcjk-UE1VV_eWDIhc",
  authDomain: "line-bot-health-check.firebaseapp.com",
  databaseURL: "https://line-bot-health-check-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "line-bot-health-check",
  storageBucket: "line-bot-health-check.firebasestorage.app",
  messagingSenderId: "1000214939530",
  appId: "1:1000214939530:web:e4bf9fe402ead4feb76a73",
  measurementId: "G-DDDMVGZD6F"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);

const app = express();

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Middleware for LINE webhook
app.use(middleware(config));

// Serve the form page
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// Webhook for LINE messages
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Handle LINE message events
function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    if (event.message.text === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`
      };
      return client.replyMessage(event.replyToken, replyMessage);
    }
  }
  return Promise.resolve(null);
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
