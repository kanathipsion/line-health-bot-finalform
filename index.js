<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Form</title>
  <script type="module">
    // Import Firebase SDK
    import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
    import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-database.js";

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
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    function submitForm() {
      const userId = new URLSearchParams(window.location.search).get('userId');
      const sugarLevel = document.getElementById('sugarLevel').value;
      const bloodPressure = document.getElementById('bloodPressure').value;
      const height = document.getElementById('height').value;
      const weight = document.getElementById('weight').value;

      // Calculate BMI
      const bmi = (weight / ((height / 100) ** 2)).toFixed(2);

      // Prepare health result
      const healthResult = {
        sugarLevel,
        bloodPressure,
        bmi,
        status: getStatus(bmi)
      };

      // Save data to Firebase
      set(ref(database, 'users/' + userId), healthResult)
        .then(() => {
          alert('ข้อมูลถูกบันทึกเรียบร้อยแล้ว');
          sendLineMessage(userId, healthResult);
        })
        .catch((error) => {
          alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
          console.error('Error:', error);
        });
    }

    function getStatus(bmi) {
      if (bmi < 18.5) return 'น้ำหนักน้อย';
      if (bmi >= 18.5 && bmi < 24.9) return 'น้ำหนักปกติ';
      if (bmi >= 25 && bmi < 29.9) return 'น้ำหนักเกิน';
      return 'อ้วน';
    }

    function sendLineMessage(userId, result) {
      fetch('/send-line-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          message: `ผลลัพธ์สุขภาพของคุณ:\n- ค่าน้ำตาล: ${result.sugarLevel}\n- ค่าความดัน: ${result.bloodPressure}\n- BMI: ${result.bmi} (${result.status})`
        })
      }).then(response => {
        if (response.ok) {
          console.log('Message sent successfully.');
        } else {
          console.error('Failed to send message.');
        }
      });
    }
  </script>
</head>
<body>
  <h1>กรอกข้อมูลสุขภาพ</h1>
  <label for="sugarLevel">ค่าน้ำตาล:</label>
  <input type="number" id="sugarLevel" required><br>
  <label for="bloodPressure">ค่าความดัน:</label>
  <input type="number" id="bloodPressure" required><br>
  <label for="height">ส่วนสูง (cm):</label>
  <input type="number" id="height" required><br>
  <label for="weight">น้ำหนัก (kg):</label>
  <input type="number" id="weight" required><br>
  <button onclick="submitForm()">ส่งข้อมูล</button>
</body>
</html>
