const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Send token response
 * @param {Object} user - User object
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {Object} profile - Optional profile data (StudentProfile or EmployerProfile)
 */
exports.sendTokenResponse = (user, statusCode, res, profile) => {
  const token = this.generateToken(user._id);

  const userData = user.toPublicJSON();
  
  // Add profile fields to user object for easy access
  if (profile) {
    if (profile.firstName && profile.lastName) {
      userData.firstName = profile.firstName;
      userData.lastName = profile.lastName;
    }
    if (profile.companyName) {
      userData.companyName = profile.companyName;
    }
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: userData
  });
};
