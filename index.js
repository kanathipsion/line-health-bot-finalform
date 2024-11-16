const express = require('express');
const path = require('path');

const app = express();

// เส้นทางสำหรับฟอร์ม
app.get('/form', (req, res) => {
  res.sendFile(path.join(__dirname, 'form.html'));
});

// เส้นทางหลัก (optional)
app.get('/', (req, res) => {
  res.send('LINE Bot Health Check Application');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
