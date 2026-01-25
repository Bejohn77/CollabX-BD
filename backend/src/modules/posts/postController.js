const asyncHandler = require('express-async-handler');
const Post = require('../../models/Post');
const User = require('../../models/User');
const StudentProfile = require('../../models/StudentProfile');
const EmployerProfile = require('../../models/EmployerProfile');
const { successResponse, paginate } = require('../../utils/helpers');

/**
 * @route   GET /api/posts/feed
 * @desc    Get personalized feed for all users
 * @access  Private
 */
exports.getFeed = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, postType, search } = req.query;
  const skip = (page - 1) * limit;

  // Build query
  let query = {
    isHidden: false,
    visibility: 'public'
  };

  // Filter by post type
  if (postType && postType !== 'all') {
    query.postType = postType;
  }

  // Search in content
  if (search) {
    query.$text = { $search: search };
  }

  // Get following list based on user role
  let following = [];
  if (req.user.role === 'student') {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    following = profile?.following || [];
  }

  // Modify query to include followed users' posts
  if (following.length > 0) {
    query = {
      $and: [
        query,
        {
          $or: [
            { author: { $in: [...following, req.user._id] } },
            { visibility: 'public' }
          ]
        }
      ]
    };
  }

  const posts = await Post.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    })
    .populate('relatedJob', 'title company')
    .populate('relatedCourse', 'title')
    .populate('comments.user', 'email')
    .populate({
      path: 'comments.user',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  const total = await Post.countDocuments(query);

  res.status(200).json({
    success: true,
    data: posts,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID
 * @access  Public
 */
exports.getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline bio'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo description'
        }
      ]
    })
    .populate('relatedJob', 'title company location')
    .populate('relatedCourse', 'title instructor')
    .populate('comments.user', 'email')
    .populate({
      path: 'comments.user',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    })
    .populate('likes.user', 'email')
    .populate({
      path: 'likes.user',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto'
        },
        {
          path: 'employerProfile',
          select: 'companyName'
        }
      ]
    });

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Increment views
  post.views += 1;
  await post.save();

  res.status(200).json(successResponse(post, 'Post retrieved successfully'));
});

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
exports.createPost = asyncHandler(async (req, res) => {
  const { content, postType, media, visibility, relatedJob, relatedCourse } = req.body;

  const post = await Post.create({
    author: req.user._id,
    content,
    postType: postType || 'general',
    media: media || [],
    visibility: visibility || 'public',
    relatedJob,
    relatedCourse
  });

  const populatedPost = await Post.findById(post._id)
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  res.status(201).json(successResponse(populatedPost, 'Post created successfully'));
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (Author only)
 */
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check ownership
  if (post.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this post'
    });
  }

  const { content, postType, media, visibility } = req.body;

  post.content = content || post.content;
  post.postType = postType || post.postType;
  post.media = media || post.media;
  post.visibility = visibility || post.visibility;

  await post.save();

  const updatedPost = await Post.findById(post._id)
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  res.status(200).json(successResponse(updatedPost, 'Post updated successfully'));
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (Author only or Admin)
 */
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check ownership or admin
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this post'
    });
  }

  await post.deleteOne();

  res.status(200).json(successResponse(null, 'Post deleted successfully'));
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like/Unlike a post
 * @access  Private
 */
exports.toggleLike = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if already liked
  const likeIndex = post.likes.findIndex(
    like => like.user.toString() === req.user._id.toString()
  );

  if (likeIndex > -1) {
    // Unlike
    post.likes.splice(likeIndex, 1);
  } else {
    // Like
    post.likes.push({ user: req.user._id });
  }

  await post.save();

  res.status(200).json(
    successResponse(
      { likesCount: post.likes.length, isLiked: likeIndex === -1 },
      likeIndex > -1 ? 'Post unliked' : 'Post liked'
    )
  );
});

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
exports.addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const post = await Post.findById(req.params.id);

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

  // Populate the new comment
  const updatedPost = await Post.findById(post._id)
    .populate('comments.user', 'email')
    .populate({
      path: 'comments.user',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  const newComment = updatedPost.comments[updatedPost.comments.length - 1];

  res.status(201).json(successResponse(newComment, 'Comment added successfully'));
});

/**
 * @route   DELETE /api/posts/:id/comment/:commentId
 * @desc    Delete a comment
 * @access  Private (Comment author or post author)
 */
exports.deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  const comment = post.comments.id(req.params.commentId);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found'
    });
  }

  // Check if user is comment author or post author
  if (
    comment.user.toString() !== req.user._id.toString() &&
    post.author.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this comment'
    });
  }

  comment.deleteOne();
  await post.save();

  res.status(200).json(successResponse(null, 'Comment deleted successfully'));
});

/**
 * @route   POST /api/posts/:id/report
 * @desc    Report a post
 * @access  Private
 */
exports.reportPost = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({
      success: false,
      message: 'Post not found'
    });
  }

  // Check if already reported by this user
  const alreadyReported = post.reports.some(
    report => report.reportedBy.toString() === req.user._id.toString()
  );

  if (alreadyReported) {
    return res.status(400).json({
      success: false,
      message: 'You have already reported this post'
    });
  }

  post.reports.push({
    reportedBy: req.user._id,
    reason
  });

  post.isReported = true;
  await post.save();

  res.status(200).json(successResponse(null, 'Post reported successfully'));
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get posts by specific user
 * @access  Public
 */
exports.getUserPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const posts = await Post.find({
    author: req.params.userId,
    isHidden: false
  })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  const total = await Post.countDocuments({
    author: req.params.userId,
    isHidden: false
  });

  res.status(200).json({
    success: true,
    data: posts,
    pagination: paginate(page, limit, total)
  });
});

/**
 * @route   GET /api/posts/my-posts
 * @desc    Get current user's posts
 * @access  Private
 */
exports.getMyPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ author: req.user._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit))
    .populate('author', 'email role')
    .populate({
      path: 'author',
      populate: [
        {
          path: 'studentProfile',
          select: 'firstName lastName profilePhoto headline'
        },
        {
          path: 'employerProfile',
          select: 'companyName logo'
        }
      ]
    });

  const total = await Post.countDocuments({ author: req.user._id });

  res.status(200).json({
    success: true,
    data: posts,
    pagination: paginate(page, limit, total)
  });
});
