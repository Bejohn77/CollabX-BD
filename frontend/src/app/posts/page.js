'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function PostsFeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [postType, setPostType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', postType: 'general', visibility: 'public' });

  useEffect(() => {
    fetchPosts();
  }, [page, postType]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page, limit: 10 };
      if (postType !== 'all') params.postType = postType;

      const response = await api.get('/posts/feed', { params });
      
      // Handle different response structures
      const postsData = Array.isArray(response.data.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      
      if (page === 1) {
        setPosts(postsData);
      } else {
        setPosts(prev => [...prev, ...postsData]);
      }
      
      setHasMore(response.data.pagination?.hasNext || false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/posts', newPost);
      setShowCreateModal(false);
      setNewPost({ content: '', postType: 'general', visibility: 'public' });
      setPage(1);
      setPosts([]); // Clear posts before fetching
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
      console.error('Error creating post:', err);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const isLiked = post.likes.some(like => like.user === localStorage.getItem('userId'));
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(like => like.user !== localStorage.getItem('userId'))
              : [...post.likes, { user: localStorage.getItem('userId') }]
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, { content });
      setPosts(posts.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            comments: [...post.comments, response.data.data]
          };
        }
        return post;
      }));
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  const getAuthorName = (post) => {
    if (post.author.studentProfile) {
      return `${post.author.studentProfile.firstName} ${post.author.studentProfile.lastName}`;
    } else if (post.author.employerProfile) {
      return post.author.employerProfile.companyName;
    }
    return post.author.email;
  };

  const getAuthorImage = (post) => {
    if (post.author.studentProfile?.profilePhoto) {
      return post.author.studentProfile.profilePhoto.startsWith('http') 
        ? post.author.studentProfile.profilePhoto 
        : `http://localhost:5000${post.author.studentProfile.profilePhoto}`;
    } else if (post.author.employerProfile?.logo) {
      return post.author.employerProfile.logo.startsWith('http')
        ? post.author.employerProfile.logo
        : `http://localhost:5000${post.author.employerProfile.logo}`;
    }
    return 'https://ui-avatars.com/api/?name=User&background=e5e7eb&color=6b7280&size=128';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Feed</h1>
          <p className="mt-2 text-gray-600">Share your thoughts, achievements, and connect with others</p>
        </div>

        {/* Create Post Card */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="text-gray-500">Share something with the community...</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {['all', 'general', 'job-achievement', 'course-completion', 'project-showcase'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setPostType(type);
                    setPage(1);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    postType === type
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Posts List */}
        {loading && page === 1 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                getAuthorName={getAuthorName}
                getAuthorImage={getAuthorImage}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage(page + 1)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Load More Posts
            </button>
          </div>
        )}

        {/* Create Post Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create Post</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreatePost}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={newPost.postType}
                    onChange={(e) => setNewPost({ ...newPost, postType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="job-achievement">Job Achievement</option>
                    <option value="course-completion">Course Completion</option>
                    <option value="project-showcase">Project Showcase</option>
                    <option value="article-share">Article Share</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visibility
                  </label>
                  <select
                    value={newPost.visibility}
                    onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="public">Public</option>
                    <option value="connections">Connections Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                  </label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows="6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="What do you want to share?"
                    required
                  ></textarea>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onLike, onComment, getAuthorName, getAuthorImage }) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const router = useRouter();

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Post Header */}
      <div className="flex items-start mb-4">
        <img
          src={getAuthorImage(post)}
          alt={getAuthorName(post)}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="ml-3 flex-1">
          <h3 className="font-semibold text-gray-900">{getAuthorName(post)}</h3>
          <p className="text-sm text-gray-500">
            {new Date(post.createdAt).toLocaleDateString()} • {post.postType.replace('-', ' ')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          post.visibility === 'public' ? 'bg-green-100 text-green-800' :
          post.visibility === 'connections' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {post.visibility}
        </span>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-b py-2 mb-2">
        <span>{post.likes.length} likes</span>
        <span>{post.comments.length} comments</span>
        <span>{post.views} views</span>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={() => onLike(post._id)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
        >
          <span>👍</span>
          <span>Like</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
        >
          <span>💬</span>
          <span>Comment</span>
        </button>
        <button
          onClick={() => router.push(`/posts/${post._id}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
        >
          <span>🔗</span>
          <span>View</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t pt-4">
          <form onSubmit={handleSubmitComment} className="mb-4">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              rows="2"
            />
            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Comment
            </button>
          </form>
          <div className="space-y-3">
            {post.comments?.filter(comment => comment && comment.user).map((comment) => (
              <div key={comment._id} className="flex space-x-3">
                <img
                  src={
                    comment.user?.studentProfile?.profilePhoto
                      ? (comment.user.studentProfile.profilePhoto.startsWith('http')
                          ? comment.user.studentProfile.profilePhoto
                          : `http://localhost:5000${comment.user.studentProfile.profilePhoto}`)
                      : comment.user?.employerProfile?.logo
                      ? (comment.user.employerProfile.logo.startsWith('http')
                          ? comment.user.employerProfile.logo
                          : `http://localhost:5000${comment.user.employerProfile.logo}`)
                      : 'https://ui-avatars.com/api/?name=User&background=e5e7eb&color=6b7280&size=128'
                  }
                  alt="Commenter"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-sm">
                    {comment.user?.studentProfile
                      ? `${comment.user.studentProfile.firstName} ${comment.user.studentProfile.lastName}`
                      : comment.user?.employerProfile?.companyName || comment.user?.email || 'Unknown User'}
                  </p>
                  <p className="text-gray-700 text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
