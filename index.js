const { google } = require('googleapis');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// โหลด Google Credentials จาก Environment Variable
const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const client = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth: client });

// ID ของ Google Sheet
const SPREADSHEET_ID = '1myXIPPbUzh340BqAmjyylFgBs9Dyuu1FOy8QDXO9DxE';

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // ส่งหน้าเว็บฟอร์ม
});

// Webhook สำหรับ LINE Bot
app.post('/webhook', (req, res) => {
  const userMessage = req.body.events[0].message.text;

  if (userMessage === 'คำนวนผลสุขภาพ') {
    const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${req.body.events[0].source.userId}`;
    return res.json({
      type: 'text',
      text: `กรุณากรอกข้อมูลสุขภาพของคุณที่ลิงก์นี้: ${formUrl}`,
    });
  }
});

// บันทึกข้อมูลจากฟอร์มไปยัง Google Sheets
app.post('/submit-form', async (req, res) => {
  const { userId, sugar, pressure, bmi } = req.body;

  const values = [[userId, sugar, pressure, bmi, new Date().toLocaleString()]];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:E',
      valueInputOption: 'RAW',
      resource: { values },
    });

    res.status(200).send('บันทึกข้อมูลเรียบร้อยแล้ว!');
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
});

// เริ่มเซิร์ฟเวอร์
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
