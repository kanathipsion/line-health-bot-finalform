app.post('/send-message', (req, res) => {
  const { userId, flexMessage } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, // ใช้ Access Token จาก Config Vars
  };

  const body = {
    to: userId,
    messages: [
      {
        type: 'flex',
        altText: 'ผลลัพธ์สุขภาพของคุณ',
        contents: flexMessage,
      },
    ],
  };

  axios
    .post('https://api.line.me/v2/bot/message/push', body, { headers })
    .then(() => {
      console.log('Flex Message sent successfully!');
      res.status(200).send('Flex Message sent successfully!');
    })
    .catch((err) => {
      console.error('Error sending Flex Message:', err.response?.data || err.message);
      res.status(500).send('Error sending Flex Message');
    });
});
