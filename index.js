const express = require('express');
const path = require('path'); // นำเข้าโมดูล path

const app = express();

// เสิร์ฟหน้าเว็บฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html')); // เส้นทางไปยังไฟล์ form.html
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
