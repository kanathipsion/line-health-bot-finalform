const express = require('express');
const bodyParser = require('body-parser');
const { Client, middleware } = require('@line/bot-sdk');
const { google } = require('googleapis');
const path = require('path');

// LINE Bot configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // เสิร์ฟไฟล์ static เช่น form.html

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', // ใส่ไฟล์ Service Account
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = '1myXIPPbUzh340BqAmjyylFgBs9Dyuu1FOy8QDXO9DxE'; // ID ของ Google Sheets

// Webhook สำหรับ LINE
app.post('/webhook', middleware(config), (req, res) => {
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
        return client.replyMessage(event.replyToken, replyMessage);
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

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// ฟังก์ชันบันทึกข้อมูลลง Google Sheets
async function appendToSheet(values) {
  const resource = { values: [values] };
  try {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      resource,
    });
    console.log(`${result.data.updates.updatedCells} cells appended.`);
  } catch (error) {
    console.error('Error appending to sheet:', error);
  }
}

// Route สำหรับบันทึกข้อมูล
app.post('/submit', async (req, res) => {
  const { sugar, pressure, height, weight, userId } = req.body;

  // คำนวณ BMI
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);

  // บันทึกข้อมูลลง Google Sheets
  const values = [userId, sugar, pressure, height, weight, bmi];
  await appendToSheet(values);

  // สร้างข้อความผลลัพธ์
  const healthMessage = `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi}`;
  const stickerId = bmi < 18.5 ? '13' : bmi < 25 ? '110' : bmi < 30 ? '111' : '112'; // เลือก Sticker ตาม BMI

  // ส่งข้อความและ Sticker กลับไปยัง LINE
  client.pushMessage(userId, {
    messages: [
      { type: 'text', text: healthMessage },
      { type: 'sticker', packageId: '1', stickerId },
    ],
  });

  res.send('ข้อมูลของคุณถูกส่งแล้ว!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
