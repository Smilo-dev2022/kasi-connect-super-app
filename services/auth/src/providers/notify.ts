import { config } from '../config';

export async function sendOtpSms(to: string, code: string): Promise<void> {
  // Lazy load twilio to avoid dep if not configured
  const sid = config.twilioAccountSid;
  const token = config.twilioAuthToken;
  const from = config.twilioFrom;
  if (!sid || !token || !from) throw new Error('twilio_not_configured');
  const twilio = require('twilio')(sid, token);
  await twilio.messages.create({ to, from, body: `Your verification code is ${code}` });
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const key = config.sendgridApiKey;
  const from = config.sendgridFrom;
  if (!key || !from) throw new Error('sendgrid_not_configured');
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(key);
  await sgMail.send({ to, from, subject: 'Your verification code', text: `Your code is ${code}`, html: `<p>Your code is <strong>${code}</strong></p>` });
}

