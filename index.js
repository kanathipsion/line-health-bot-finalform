const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // เสิร์ฟไฟล์ static เช่น form.html

// Google Sheets API Setup
const base64Credentials = process.env.GOOGLE_CREDENTIALS_BASE64;
const decodedCredentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
const credentials = JSON.parse(decodedCredentials);

const authClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth: authClient });

// API Endpoint สำหรับส่งข้อความและสติกเกอร์ไปยังผู้ใช้
app.post('/send-message', async (req, res) => {
  const { userId, message, packageId, stickerId, height, weight } = req.body;

  try {
    // คำนวณ BMI
    const bmi = (weight / Math.pow(height / 100, 2)).toFixed(2);

    // สร้างข้อความผลลัพธ์สุขภาพ
    const healthMessage = `${message}\n\nผลลัพธ์สุขภาพของคุณ:\n- BMI: ${bmi}`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    };

    const body = {
      to: userId,
      messages: [
        { type: 'text', text: healthMessage },
        { type: 'sticker', packageId, stickerId },
      ],
    };

    // ส่งข้อความและสติกเกอร์กลับไปยัง LINE
    await axios.post('https://api.line.me/v2/bot/message/push', body, { headers });

    // บันทึกข้อมูลลงใน Google Sheets
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[userId, height, weight, bmi, new Date().toISOString()]],
      },
    });

    console.log('Message sent and data saved successfully!');
    res.status(200).send('Message sent and data saved successfully!');
  } catch (err) {
    console.error('Error sending message or saving data:', err.response?.data || err.message);
    res.status(500).send('Error sending message or saving data');
  }
});

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Webhook สำหรับตอบข้อความจากผู้ใช้
app.post('/webhook', (req, res) => {
  const events = req.body.events;
  const replyPromises = events.map((event) => {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;

      if (userMessage === 'คำนวนผลสุขภาพ') {
        const formUrl = `https://${req.headers.host}/form?userId=${event.source.userId}`;
        const replyMessage = {
          type: 'text',
          text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
        };

        return replyMessageToUser(event.replyToken, replyMessage);
      }
    }
    return Promise.resolve(null);
  });

  Promise.all(replyPromises)
    .then(() => res.status(200).end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันสำหรับตอบข้อความกลับไปยัง LINE
const replyMessageToUser = (replyToken, message) => {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };

  const body = {
    replyToken: replyToken,
    messages: [message],
  };

  return axios.post('https://api.line.me/v2/bot/message/reply', body, { headers });
};

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
