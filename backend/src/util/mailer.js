// utils/mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Thêm console log để kiểm tra biến môi trường có load đúng không

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // ⚠️ Chỗ này bạn đang dùng sai tên biến
    // Bạn đang để trong .env là GMAIL_USER và GMAIL_APP_PASSWORD
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});



export default transporter;
