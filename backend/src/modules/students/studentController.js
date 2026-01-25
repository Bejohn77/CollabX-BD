const StudentProfile = require('../../models/StudentProfile');
const Post = require('../../models/Post');
const { asyncHandler } = require('../../utils/helpers');
const { successResponse, paginate } = require('../../utils/helpers');

/**
 * @route   GET /api/students/profile
 * @desc    Get student profile
 * @access  Private (Student)
 */
exports.getProfile = asyncHandler(async (req, res) => {
  let profile = await StudentProfile.findOne({ user: req.user._id })
    .populate('recommendations.recommendedBy', 'email')
    .populate('followers', 'email')
    .populate('following', 'email');

  // If profile doesn't exist, create a default one
  if (!profile) {
    console.log('Profile not found, creating default profile for user:', req.user._id);
    profile = await StudentProfile.create({
      user: req.user._id,
      firstName: '',
      lastName: ''
    });
  }

  res.status(200).json(successResponse(profile, 'Profile retrieved successfully'));
});

/**
 * @route   PUT /api/students/profile
 * @desc    Update student profile
 * @access  Private (Student)
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'firstName', 'lastName', 'bio', 'phone', 'location', 'education',
    'university', 'skills', 'projects', 'experience', 'certifications',
    'jobPreferences', 'socialLinks', 'isLookingForJob', 'isAvailableForFreelance', 'profilePhoto'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key) && key !== 'profilePhoto') {
      // Parse JSON strings from FormData
      try {
        const value = typeof req.body[key] === 'string' && 
                       (req.body[key].startsWith('{') || req.body[key].startsWith('['))
          ? JSON.parse(req.body[key])
          : req.body[key];
        
        // Skip empty objects, empty arrays, and empty strings
        if (value !== '' && JSON.stringify(value) !== '{}' && JSON.stringify(value) !== '[]') {
          updates[key] = value;
        }
      } catch (e) {
        updates[key] = req.body[key];
      }
    }
  });

  // If file uploaded, use the file path
  if (req.file) {
    updates.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    console.log('📸 Profile photo uploaded:', {
      filename: req.file.filename,
      path: updates.profilePhoto,
      size: req.file.size
    });
  }

  // Try to find existing profile
  let profile = await StudentProfile.findOne({ user: req.user._id });

  // If profile doesn't exist, create it
  if (!profile) {
    console.log('Profile not found, creating new profile for user:', req.user._id);
    profile = await StudentProfile.create({
      user: req.user._id,
      ...updates
    });
  } else {
    // Update profile fields
    Object.keys(updates).forEach(key => {
      // Additional safety check for profilePhoto
      if (key === 'profilePhoto' && (typeof updates[key] === 'object' || updates[key] === '')) {
        return; // Skip empty/object profilePhoto
      }
      profile[key] = updates[key];
    });
    
    // Save to trigger pre-save hook for completeness calculation
    await profile.save();
  }

  res.status(200).json(successResponse(profile, 'Profile updated successfully'));
});

/**
 * @route   GET /api/students/:id
 * @desc    Get public student profile
 * @access  Public
 */
exports.getPublicProfile = asyncHandler(async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.params.id })
    .populate('user', 'email isVerified createdAt')
    .populate('recommendations.recommendedBy', 'email');

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  // Increment profile views
  profile.profileViews += 1;
  await profile.save();

  res.status(200).json(successResponse(profile, 'Profile retrieved successfully'));
});

/**
 * @route   POST /api/students/follow/:userId
 * @desc    Follow another user
 * @access  Private (Student)
 */
exports.followUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({
      success: false,
      message: 'You cannot follow yourself'
    });
  }

  const profile = await StudentProfile.findOne({ user: req.user._id });
  const targetProfile = await StudentProfile.findOne({ user: userId });

  if (!targetProfile) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already following
  if (profile.following.includes(userId)) {
    return res.status(400).json({
      success: false,
      message: 'Already following this user'
    });
  }

  // Add to following list
  profile.following.push(userId);
  await profile.save();

  // Add to followers list
  targetProfile.followers.push(req.user._id);
  await targetProfile.save();

  res.status(200).json(successResponse(null, 'User followed successfully'));
});

/**
 * @route   DELETE /api/students/unfollow/:userId
 * @desc    Unfollow a user
 * @access  Private (Student)
 */
exports.unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const profile = await StudentProfile.findOne({ user: req.user._id });
  const targetProfile = await StudentProfile.findOne({ user: userId });

  if (!targetProfile) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Remove from following list
  profile.following = profile.following.filter(id => id.toString() !== userId);
  await profile.save();

  // Remove from followers list
  targetProfile.followers = targetProfile.followers.filter(id => id.toString() !== req.user._id.toString());
  await targetProfile.save();

  res.status(200).json(successResponse(null, 'User unfollowed successfully'));
});

/**
 * @route   POST /api/students/posts
 * @desc    Create a new post
 * @access  Private (Student)
 */
exports.createPost = asyncHandler(async (req, res) => {
  const { content, postType, media, visibility } = req.body;

  const post = await Post.create({
    author: req.user._id,
    content,
    postType: postType || 'general',
    media: media || [],
    visibility: visibility || 'public'
  });

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'email')
    .populate({
      path: 'author',
      populate: {
        path: 'studentProfile',
        select: 'firstName lastName profilePhoto'
      }
    });

  res.status(201).json(successResponse(populatedPost, 'Post created successfully'));
});

/**
 * @route   GET /api/students/feed
 * @desc    Get personalized feed
 * @access  Private (Student)
 */
exports.getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get user's following list
  const profile = await StudentProfile.findOne({ user: req.user._id });
  const following = profile.following || [];

  // Get posts from followed users + own posts
  const posts = await Post.find({
    $or: [
      { author: { $in: [...following, req.user._id] } },
      { visibility: 'public' }
    ],
    isHidden: false
  })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'email')
    .populate({
      path: 'author',
      populate: {
        path: 'studentProfile',
        select: 'firstName lastName profilePhoto'
      }
    });

  const total = await Post.countDocuments({
    $or: [
      { author: { $in: [...following, req.user._id] } },
      { visibility: 'public' }
    ],
    isHidden: false
  });

  res.status(200).json({
    success: true,
    data: posts,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   POST /api/students/posts/:postId/like
 * @desc    Like a post
 * @access  Private
 */
exports.likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if already liked
  const alreadyLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());

  if (alreadyLiked) {
    // Unlike
    post.likes = post.likes.filter(like => like.user.toString() !== req.user._id.toString());
  } else {
    // Like
    post.likes.push({ user: req.user._id });
  }

  await post.save();

  res.status(200).json(successResponse(post, alreadyLiked ? 'Post unliked' : 'Post liked'));
});

/**
 * @route   POST /api/students/posts/:postId/comment
 * @desc    Comment on a post
 * @access  Private
 */
exports.commentOnPost = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const post = await Post.findById(req.params.postId);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  post.comments.push({
    user: req.user._id,
    content
  });

  await post.save();

  const populatedPost = await Post.findById(post._id)
    .populate('comments.user', 'email')
    .populate({
      path: 'comments.user',
      populate: {
        path: 'studentProfile',
        select: 'firstName lastName profilePhoto'
      }
    });

  res.status(201).json(successResponse(populatedPost, 'Comment added successfully'));
});

/**
 * @route   POST /api/students/skills/:skillName/endorse
 * @desc    Endorse a skill
 * @access  Private
 */
exports.endorseSkill = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const { skillName } = req.params;

  const profile = await StudentProfile.findOne({ user: userId });

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Profile not found'
    });
  }

  const skill = profile.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());

  if (!skill) {
    return res.status(404).json({
      success: false,
      message: 'Skill not found'
    });
  }

  // Check if already endorsed
  const alreadyEndorsed = skill.endorsements.some(e => e.endorsedBy.toString() === req.user._id.toString());

  if (alreadyEndorsed) {
    return res.status(400).json({
      success: false,
      message: 'You have already endorsed this skill'
    });
  }

  skill.endorsements.push({ endorsedBy: req.user._id });
  await profile.save();

  res.status(200).json(successResponse(profile, 'Skill endorsed successfully'));
});
