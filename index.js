const express = require('express');
const { Client } = require('@line/bot-sdk');
const path = require('path');

const app = express();
app.use(express.json()); // รองรับการ parse JSON payload จาก body

// LINE Bot configurations
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(config);

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// รับข้อมูลจากฟอร์มและตอบกลับข้อความ
app.post('/submit', (req, res) => {
  try {
    const { userId, sugar, pressure, height, weight } = req.body;

    if (!userId || !sugar || !pressure || !height || !weight) {
      res.status(400).send('ข้อมูลไม่ครบถ้วน');
      return;
    }

    // คำนวณ BMI
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);

    // กำหนดสถานะสุขภาพตาม BMI
    let status = '';
    let stickerId = '13'; // ค่า default stickerId

    if (bmi < 18.5) {
      status = 'น้ำหนักน้อย';
      stickerId = '11537';
    } else if (bmi < 24.9) {
      status = 'สุขภาพดี';
      stickerId = '13';
    } else if (bmi < 29.9) {
      status = 'น้ำหนักเกิน';
      stickerId = '110';
    } else {
      status = 'อ้วน';
      stickerId = '111';
    }

    // เตรียมข้อความที่จะส่งกลับ
    const replyMessages = [
      {
        type: 'text',
        text: `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi} (${status})`,
      },
      {
        type: 'sticker',
        packageId: '1',
        stickerId: stickerId,
      },
    ];

    // ส่งข้อความกลับไปยัง LINE
    client.pushMessage(userId, replyMessages)
      .then(() => res.send('ส่งข้อความสำเร็จ!'))
      .catch((err) => {
        console.error('Error sending message to LINE:', err);
        res.status(500).send('เกิดข้อผิดพลาดในการส่งข้อความ');
      });
  } catch (error) {
    console.error('Error in /submit:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการประมวลผล');
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
