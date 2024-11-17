const express = require('express');
const { google } = require('googleapis');
const { Client, middleware } = require('@line/bot-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// Middleware for LINE webhook
app.use(middleware(config));

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// Google Sheets ID
const SPREADSHEET_ID = '1myXIPPbUzh340BqAmjyylFgBs9Dyuu1FOy8QDXO9DxE';

// Serve the form
app.get('/form', (req, res) => {
  res.sendFile(__dirname + '/form.html');
});

// Webhook to handle messages from LINE
app.post('/webhook', (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Function to handle LINE events
async function handleEvent(event) {
  if (event.type === 'message' && event.message.type === 'text') {
    const userMessage = event.message.text;

    if (userMessage === 'คำนวนผลสุขภาพ') {
      const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
      const replyMessage = {
        type: 'text',
        text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
      };
      return client.replyMessage(event.replyToken, replyMessage);
    }
  }

  return Promise.resolve(null);
}

// API to handle form submissions
app.post('/submit', async (req, res) => {
  const { userId, weight, height, sugar, pressure } = req.body;

  // Calculate BMI
  const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
  let healthStatus = '';
  if (bmi < 18.5) healthStatus = 'น้ำหนักน้อย';
  else if (bmi < 25) healthStatus = 'น้ำหนักปกติ';
  else if (bmi < 30) healthStatus = 'น้ำหนักเกิน';
  else healthStatus = 'อ้วน';

  // Save data to Google Sheets
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[userId, weight, height, sugar, pressure, bmi, healthStatus]],
      },
    });
    console.log('Data saved to Google Sheets');
  } catch (error) {
    console.error('Error saving data to Google Sheets:', error);
    res.status(500).send('Error saving data');
    return;
  }

  // Send response to LINE
  const replyMessage = [
    {
      type: 'text',
      text: `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi} (${healthStatus})`,
    },
    {
      type: 'sticker',
      packageId: '1',
      stickerId: '13',
    },
  ];

  try {
    await client.pushMessage(userId, replyMessage);
    res.send('Data submitted and LINE message sent');
  } catch (error) {
    console.error('Error sending LINE message:', error);
    res.status(500).send('Error sending LINE message');
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
