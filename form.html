app.post('/send-message', (req, res) => {
  const { userId, message, packageId, stickerId } = req.body;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`, // ใช้ Access Token จาก Config Vars
  };

  const body = {
    to: userId,
    messages: [
      { type: 'text', text: message },
      { type: 'sticker', packageId, stickerId },
    ],
  };

  axios
    .post('https://api.line.me/v2/bot/message/push', body, { headers })
    .then(() => {
      console.log('Message sent successfully!');
      res.status(200).send('Message sent successfully!');
    })
    .catch((err) => {
      console.error('Error sending message:', err.response?.data || err.message);
      res.status(500).send('Error sending message');
    });
});
