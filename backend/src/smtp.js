require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

transporter.verify((err, success) => {
  if (err) console.error('❌ Lỗi SMTP:', err);
  else console.log('✅ Gmail SMTP hoạt động tốt');
});

module.exports = transporter;
