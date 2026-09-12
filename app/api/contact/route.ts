import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const MIN_SUBMIT_MS = 3000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_LENGTHS = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-process submission log for rate limiting. Resets on restart/redeploy,
// which is fine for a low-volume contact form on a single long-running server.
const submissionsByIp = new Map<string, number[]>();

function getClientIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const recent = (submissionsByIp.get(ip) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  recent.push(now);
  submissionsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json({ success: false }, { status: 429 });
  }

  const formData = await request.formData();

  // Honeypot: real users never see or fill this field, bots often do.
  if (formData.get('website')?.toString()) {
    return NextResponse.json({ success: true });
  }

  // Time trap: bots tend to fill and submit the form almost instantly.
  const renderedAt = Number(formData.get('ts'));
  if (!renderedAt || Date.now() - renderedAt < MIN_SUBMIT_MS) {
    return NextResponse.json({ success: true });
  }

  const name = formData.get('name')?.toString().trim().slice(0, MAX_LENGTHS.name) ?? '';
  const email = formData.get('email')?.toString().trim().slice(0, MAX_LENGTHS.email) ?? '';
  const message = formData.get('message')?.toString().trim().slice(0, MAX_LENGTHS.message) ?? '';

  if (!name || !email || !message || !EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    replyTo: email,
    to: process.env.CONTACT_TO || process.env.GMAIL_USER,
    subject: `New Contact Form Submission from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
