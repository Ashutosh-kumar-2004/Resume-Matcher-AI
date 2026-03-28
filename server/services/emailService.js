import nodemailer from 'nodemailer';

// Create transporter based on configuration
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'custom') {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Gmail or other service
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
        Reset Password
      </a>
      <p>Or copy and paste this link in your browser:</p>
      <p>${resetUrl}</p>
      <p><strong>This link will expire in 5 minutes.</strong></p>
      <p>If you did not request this password reset, please ignore this email.</p>
      <p>Best regards,<br/>Resume Checker Team</p>
    `;

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
    throw error;
  }
};

// Send password reset success email
export const sendPasswordResetSuccessEmail = async (user) => {
  try {
    const message = `
      <h1>Password Reset Successful</h1>
      <p>Hi ${user.name},</p>
      <p>Your password has been successfully reset.</p>
      <p>If you did not reset your password, please contact support immediately.</p>
      <p>Best regards,<br/>Resume Checker Team</p>
    `;

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Password Reset Successful',
      html: message,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset success email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending password reset success email:', error.message);
    throw error;
  }
};
