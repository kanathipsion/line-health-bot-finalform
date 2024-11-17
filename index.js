const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const { Client } = require('@line/bot-sdk');

const app = express();

// ตั้งค่า LINE Bot
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(lineConfig);

// ใช้งาน bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// เสิร์ฟหน้า HTML
app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

// ฟังก์ชันสำหรับเชื่อมต่อ Google Sheets
const addToGoogleSheet = async (data) => {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = '1myXIPPbUzh340BqAmjyylFgBs9Dyuu1FOy8QDXO9DxE'; // แทนด้วย Spreadsheet ID ของคุณ
    const range = 'Sheet1!A:D'; // แทนด้วย Range ใน Google Sheets

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        requestBody: {
            values: [
                [data.userId, data.sugarLevel, data.bloodPressure, data.bmi],
            ],
        },
    });
};

// รับข้อมูลจากฟอร์ม
app.post('/submit', async (req, res) => {
    try {
        console.log('Received data:', req.body);
        const { userId, sugarLevel, bloodPressure, bmi } = req.body;

        // เพิ่มข้อมูลลง Google Sheets
        await addToGoogleSheet({ userId, sugarLevel, bloodPressure, bmi });

        // ส่งข้อความและสติกเกอร์กลับไปยัง LINE
        await client.pushMessage(userId, [
            {
                type: 'text',
                text: `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugarLevel}\n- ค่าความดัน: ${bloodPressure}\n- BMI: ${bmi}`,
            },
            {
                type: 'sticker',
                packageId: '1',
                stickerId: '13',
            },
        ]);

        res.status(200).send('Success');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error');
    }
});

// ตั้งค่า Webhook สำหรับ LINE
app.post('/webhook', (req, res) => {
    Promise.all(req.body.events.map((event) => handleEvent(event)))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// ฟังก์ชันสำหรับจัดการข้อความใน LINE
const handleEvent = async (event) => {
    if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;

        if (userMessage === 'คำนวนผลสุขภาพ') {
            const formUrl = `https://line-bot-health-check-477c415b127f.herokuapp.com/form?userId=${event.source.userId}`;
            await client.replyMessage(event.replyToken, {
                type: 'text',
                text: `กรุณากรอกข้อมูลสุขภาพของคุณได้ที่ลิงก์นี้: ${formUrl}`,
            });
        }
    }
};

// เริ่มต้นเซิร์ฟเวอร์
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
