import jwt from 'jsonwebtoken';

// @desc    Protect routes - Verify JWT Token
export const protect = async (req, res, next) => {
  const token = req.cookies.jwt;

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Authentication cookie is missing',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};
