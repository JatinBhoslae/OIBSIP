import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  try {
    // If credentials are not set, log and return to simulate success
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log('--- EMAIL SIMULATED ---');
      console.log(`To: ${options.email}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Message:\n${options.message}`);
      console.log('-----------------------');
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const message = {
      from: `${process.env.FROM_NAME || 'PizzaHub'} <${process.env.FROM_EMAIL || 'noreply@pizzahub.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || `<p>${options.message}</p>`,
    };

    const info = await transporter.sendMail(message);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error.message);
    // Don't crash the server, just return false
    return false;
  }
};

export default sendEmail;
