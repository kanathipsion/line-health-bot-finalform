const express = require('express');
const { Client } = require('@line/bot-sdk');
const axios = require('axios');

const app = express();

// Middleware สำหรับรับข้อมูลจากฟอร์ม
app.use(express.urlencoded({ extended: true }));

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

// รับข้อมูลจากฟอร์มและประมวลผล
app.post('/submit-form', (req, res) => {
  const { sugar, pressure, weight, height, userId } = req.body;

  // ดึงข้อมูลโปรไฟล์ผู้ใช้จาก LINE OA
  client.getProfile(userId)
    .then((profile) => {
      const displayName = profile.displayName; // ชื่อที่แสดงของผู้ใช้

      // คำนวณค่า BMI
      const bmi = (weight / Math.pow(height / 100, 2)).toFixed(2);
      let status = '';
      let advice = '';

      // ประเมินผลสุขภาพ
      if (sugar <= 100 && pressure <= 120 && bmi >= 18.5 && bmi <= 24.9) {
        status = 'ปกติ';
        advice = 'สุขภาพของคุณอยู่ในเกณฑ์ปกติ';
      } else if ((sugar > 100 && sugar <= 125) || (pressure > 120 && pressure <= 140) || (bmi >= 25 && bmi <= 29.9)) {
        status = 'เสี่ยง';
        advice = 'สุขภาพของคุณอยู่ในระดับเสี่ยง';
      } else {
        status = 'อันตราย';
        advice = 'สุขภาพของคุณอยู่ในระดับอันตราย';
      }

      // ส่งข้อความและสติกเกอร์ไปยัง LINE
      client.pushMessage(userId, {
        type: 'text',
        text: `สวัสดีคุณ ${displayName}, กำลังประมวลผลข้อมูลของคุณ กรุณารอสักครู่...`,
      }).then(() => {
        let stickerId;
        if (status === 'ปกติ') {
          stickerId = '52002739'; // Sticker ID สีเขียว
        } else if (status === 'เสี่ยง') {
          stickerId = '52002741'; // Sticker ID สีเหลือง
        } else {
          stickerId = '52002747'; // Sticker ID สีแดง
        }

        return client.pushMessage(userId, {
          type: 'sticker',
          packageId: '1',
          stickerId: stickerId,
        });
      }).then(() => {
        // บันทึกข้อมูลลงใน Google Sheets หลังจากการส่งข้อความและสติกเกอร์สำเร็จ
        return axios.post('YOUR_GOOGLE_APPS_SCRIPT_URL', {
          userId: userId,
          displayName: displayName,
          sugarLevel: sugar,
          pressureLevel: pressure,
          weight: weight,
          height: height,
          bmi: bmi,
          healthStatus: status,
          advice: advice
        });
      }).then(response => {
        console.log('Data sent to Google Sheets:', response.data);
        res.send('<h1>ข้อมูลของคุณได้รับการบันทึกแล้ว</h1>');
      }).catch(error => {
        console.error('Error in process:', error);
        res.status(500).send('Error processing request');
      });
    })
    .catch((err) => {
      console.error('Error getting profile:', err);
      res.status(500).send('Error retrieving user profile');
    });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
