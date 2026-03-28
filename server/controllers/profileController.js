import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile (name, contact number, bio - email is non-changeable)
// @route   PUT /api/profile/update
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, contactNumber, bio } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Validate input
    if (!name && !contactNumber && !bio) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update (name, contactNumber, or bio)',
      });
    }

    // Update name
    if (name) {
      if (name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Name cannot be empty',
        });
      }
      if (name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters',
        });
      }
      user.name = name.trim();
    }

    // Update contact number
    if (contactNumber !== undefined) {
      if (contactNumber === '') {
        // Allow empty contact number to remove it
        user.contactNumber = '';
      } else if (contactNumber) {
        // Validate phone number format (basic validation)
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        if (!phoneRegex.test(contactNumber.replace(/\s/g, ''))) {
          return res.status(400).json({
            success: false,
            message: 'Please provide a valid contact number',
          });
        }
        user.contactNumber = contactNumber.trim();
      }
    }

    // Update bio
    if (bio !== undefined) {
      if (bio === '') {
        // Allow empty bio to remove it
        user.bio = '';
      } else if (bio) {
        if (bio.trim().length > 500) {
          return res.status(400).json({
            success: false,
            message: 'Bio cannot be more than 500 characters',
          });
        }
        user.bio = bio.trim();
      }
    }

    // Save updated user
    await user.save({ validateBeforeSave: true });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        bio: user.bio,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get user profile by ID (public route)
// @route   GET /api/profile/:userId
// @access  Public
export const getProfileById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email contactNumber bio createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        contactNumber: user.contactNumber,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/profile/delete
// @access  Private
export const deleteProfile = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password to delete account',
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Password is incorrect. Account deletion cancelled.',
      });
    }

    // Delete user
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
