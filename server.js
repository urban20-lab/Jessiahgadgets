// server.js
// Simple OTP backend using Nodemailer + Express
// CHANGE: The code expects EMAIL_USER and EMAIL_PASS to be set in environment variables
// (or use a .env file + dotenv; instructions below).
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

// If you plan to use a .env file during local development, uncomment the next line
// and run `npm install dotenv` first:
// require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const path = require('path');
// serve index.html when visiting "/"
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});


const otps = {}; // in-memory OTP store (for demo only)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otps[email] = otp;

  // Configure transporter using Gmail (use App Password)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // CHANGE: set this in env or .env
      pass: process.env.EMAIL_PASS  // CHANGE: set this to Gmail App Password
    }
  });

  try {
    await transporter.sendMail({
      from: `"Secure OTP" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP Code',
      text: `Your one-time code is: ${otp}`,
      html: `<p>Your one-time code is: <strong>${otp}</strong></p>`
    });

    console.log(`OTP for ${email} = ${otp}`); // logged locally for debugging
    return res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending email:', err);
    return res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  if (otps[email] && otps[email] === otp) {
    delete otps[email]; // consume OTP
    return res.json({ message: 'OTP verified successfully' });
  } else {
    return res.status(400).json({ error: 'Invalid OTP' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

