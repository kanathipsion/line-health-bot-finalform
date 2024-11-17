<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Form</title>
</head>
<body>
  <h1>กรอกข้อมูลสุขภาพของคุณ</h1>
  <form id="healthForm">
    <label for="sugar">ค่าน้ำตาล (mg/dL):</label><br>
    <input type="number" id="sugar" name="sugar" required><br><br>

    <label for="pressure">ค่าความดัน (mmHg):</label><br>
    <input type="number" id="pressure" name="pressure" required><br><br>

    <label for="height">ส่วนสูง (cm):</label><br>
    <input type="number" id="height" name="height" required><br><br>

    <label for="weight">น้ำหนัก (kg):</label><br>
    <input type="number" id="weight" name="weight" required><br><br>

    <input type="hidden" id="userId" value="">
    <button type="submit">ส่งข้อมูล</button>
  </form>

  <script>
    // ดึงค่า userId จาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    document.getElementById('userId').value = userId;

    // ส่งข้อมูลไปยังเซิร์ฟเวอร์
    document.getElementById('healthForm').addEventListener('submit', (event) => {
      event.preventDefault();

      const sugar = document.getElementById('sugar').value;
      const pressure = document.getElementById('pressure').value;
      const height = document.getElementById('height').value;
      const weight = document.getElementById('weight').value;

      const bmi = (weight / Math.pow(height / 100, 2)).toFixed(2);
      let healthMessage = `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${sugar}\n- ค่าความดัน: ${pressure}\n- BMI: ${bmi}`;

      let packageId = '1'; // ตัวอย่าง Package ID
      let stickerId = '13'; // ตัวอย่าง Sticker ID

      if (bmi < 18.5) {
        healthMessage += ' (น้ำหนักน้อย)';
      } else if (bmi < 25) {
        healthMessage += ' (ปกติ)';
        stickerId = '110'; // ตัวอย่างสติกเกอร์สีเขียว
      } else if (bmi < 30) {
        healthMessage += ' (น้ำหนักเกิน)';
        stickerId = '111'; // ตัวอย่างสติกเกอร์สีเหลือง
      } else {
        healthMessage += ' (อ้วน)';
        stickerId = '112'; // ตัวอย่างสติกเกอร์สีแดง
      }

      fetch('/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          message: healthMessage,
          packageId: packageId,
          stickerId: stickerId,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to send message');
          }
          alert('ส่งข้อมูลสำเร็จ! กรุณาตรวจสอบ LINE ของคุณ');
        })
        .catch((error) => {
          console.error('Error:', error);
          alert('เกิดข้อผิดพลาด: ' + error.message);
        });
    });
  </script>
</body>
</html>
