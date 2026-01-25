const User = require('../../models/User');
const StudentProfile = require('../../models/StudentProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const { sendTokenResponse } = require('../../utils/auth');
const { asyncHandler } = require('../../utils/helpers');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, role, ...profileData } = req.body;

  console.log('Registration attempt:', { email, role, hasPassword: !!password });

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Create user
  const user = await User.create({
    email,
    password,
    role: role || 'student'
  });

  console.log('User created successfully:', { id: user._id, email: user.email, role: user.role });

  // Create role-specific profile
  let profile;
  if (user.role === 'student') {
    profile = await StudentProfile.create({
      user: user._id,
      firstName: profileData.firstName || '',
      lastName: profileData.lastName || '',
      ...profileData
    });
  } else if (user.role === 'employer') {
    profile = await EmployerProfile.create({
      user: user._id,
      companyName: profileData.companyName || '',
      industry: profileData.industry || '',
      ...profileData
    });
  }

  // Send token response with profile data
  sendTokenResponse(user, 201, res, profile);
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, hasPassword: !!password, passwordLength: password?.length });

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user (include password for comparison)
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log('User not found:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  console.log('User found:', { id: user._id, email: user.email, role: user.role, hasHashedPassword: !!user.password });

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    console.log('Password mismatch for user:', email);
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact support.'
    });
  }

  // Update last login without triggering password hash
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  // Get profile data
  let profile;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ user: user._id });
  } else if (user.role === 'employer') {
    profile = await EmployerProfile.findOne({ user: user._id });
  }

  // Send token response with profile data
  sendTokenResponse(user, 200, res, profile);
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged in user
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.user._id);

  // Populate role-specific profile
  if (user.role === 'student') {
    user = await User.findById(req.user._id).populate('studentProfile');
  } else if (user.role === 'employer') {
    user = await User.findById(req.user._id).populate('employerProfile');
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @route   PUT /api/auth/update-password
 * @desc    Update password
 * @access  Private
 */
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});
