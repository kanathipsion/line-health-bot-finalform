const express = require('express');
const bodyParser = require('body-parser');
const { Client, middleware } = require('@line/bot-sdk');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Google Sheets configurations
const spreadsheetId = '1myXIPPbUzh340BqAmjyylFgBs9Dyuu1FOy8QDXO9DxE'; // ใส่ Spreadsheet ID

// Middleware สำหรับ LINE webhook
app.use(middleware(config));

// ฟังก์ชันสำหรับบันทึกข้อมูลลง Google Sheets
async function appendToGoogleSheet(data) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS), // อ่านข้อมูลจาก environment variable
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A1', // ช่วงข้อมูลใน Google Sheets
      valueInputOption: 'RAW',
      requestBody: {
        values: [data], // ข้อมูลที่ต้องการบันทึก
      },
    });
    console.log('Data added to Google Sheets successfully.');
  } catch (err) {
    console.error('Error adding data to Google Sheets:', err);
  }
}

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// รับข้อมูลจากฟอร์มและบันทึกลง Google Sheets
app.post('/submit-data', async (req, res) => {
  const { sugar, pressure, bmi, userId } = req.body; // รับข้อมูลจากฟอร์ม
  const data = [new Date().toISOString(), userId, sugar, pressure, bmi]; // ข้อมูลที่ต้องการบันทึก

  try {
    await appendToGoogleSheet(data); // บันทึกข้อมูลลง Google Sheets
    res.status(200).send('บันทึกข้อมูลสำเร็จ');
  } catch (error) {
    console.error('Error submitting data:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
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
async function handleEvent(event) {
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
  return Promise.resolve(null); // ไม่ตอบกลับข้อความอื่น
}

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
