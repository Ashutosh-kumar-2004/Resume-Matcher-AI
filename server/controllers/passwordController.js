import User from '../models/User.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendPasswordResetSuccessEmail } from '../services/emailService.js';

// @desc    Forgot Password - Send reset email
// @route   POST /api/password/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address',
      });
    }

    // Check if user already requested a password reset within the last 1 minute
    if (user.lastPasswordResetEmailSent) {
      const timeSinceLastEmail = Date.now() - new Date(user.lastPasswordResetEmailSent).getTime();
      const oneMinute = 60 * 1000;

      if (timeSinceLastEmail < oneMinute) {
        const remainingSeconds = Math.ceil((oneMinute - timeSinceLastEmail) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting another password reset email`,
          retryAfter: remainingSeconds,
        });
      }
    }

    // Generate password reset token
    const resetToken = user.getPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Update last password reset email sent timestamp
    user.lastPasswordResetEmailSent = Date.now();
    await user.save({ validateBeforeSave: false });

    try {
      // Send password reset email
      await sendPasswordResetEmail(user, resetToken);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        email: user.email,
      });
    } catch (error) {
      // Clear reset token fields if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpire = undefined;
      user.lastPasswordResetEmailSent = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email. Please try again later.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Reset Password using token
// @route   POST /api/password/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { password, passwordConfirm } = req.body;
    const { token } = req.params;

    // Validate input
    if (!password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide password and password confirmation',
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Hash the token to match with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and check expiration
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    user.lastPasswordResetEmailSent = undefined;
    await user.save();

    try {
      // Send password reset success email
      await sendPasswordResetSuccessEmail(user);
    } catch (error) {
      console.error('Error sending success email:', error);
      // Don't fail the request if success email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if password reset token is valid
// @route   POST /api/password/validate-token/:token
// @access  Public
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required',
      });
    }

    // Hash the token to match with database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Check if token exists and is not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpire: { $gt: Date.now() },
    }).select('email');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Change Password (Authenticated User)
// @route   POST /api/password/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation',
      });
    }

    // Get user with password field
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify current password
    const isPasswordCorrect = await user.matchPassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Check if new password matches confirmation
    if (newPassword !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match',
      });
    }

    // Check if new password is at least 6 characters
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    // Check if new password is same as current password
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    try {
      // Send password change notification email
      await sendPasswordResetSuccessEmail(user);
    } catch (error) {
      console.error('Error sending notification email:', error);
      // Don't fail the request if notification email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
