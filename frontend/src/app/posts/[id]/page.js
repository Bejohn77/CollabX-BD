'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function PostDetailPage({ params }) {
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/posts/${params.id}`);
      setPost(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/posts/${params.id}/like`);
      fetchPost();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await api.post(`/posts/${params.id}/comment`, { content: commentText });
      setCommentText('');
      fetchPost();
    } catch (err) {
      console.error('Failed to comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/posts/${params.id}/comment/${commentId}`);
      fetchPost();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const getAuthorName = () => {
    if (!post) return '';
    if (post.author.studentProfile) {
      return `${post.author.studentProfile.firstName} ${post.author.studentProfile.lastName}`;
    } else if (post.author.employerProfile) {
      return post.author.employerProfile.companyName;
    }
    return post.author.email;
  };

  const getAuthorImage = () => {
    if (!post) return 'https://ui-avatars.com/api/?name=User&background=e5e7eb&color=6b7280&size=128';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-700">{error || 'Post not found'}</p>
          <button
            onClick={() => router.push('/posts')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 transition"
        >
          <span className="mr-2">←</span>
          Back
        </button>

        {/* Post Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Post Header */}
          <div className="flex items-start mb-6">
            <img
              src={getAuthorImage()}
              alt={getAuthorName()}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{getAuthorName()}</h2>
                  {post.author.studentProfile?.headline && (
                    <p className="text-gray-600 dark:text-gray-300">{post.author.studentProfile.headline}</p>
                  )}
                  {post.author.employerProfile?.description && (
                    <p className="text-gray-600 dark:text-gray-300">{post.author.employerProfile.description}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  post.visibility === 'public' ? 'bg-green-100 text-green-800' :
                  post.visibility === 'connections' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {post.visibility}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {new Date(post.createdAt).toLocaleString()} • {post.postType.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Post Content */}
          <div className="mb-6">
            <p className="text-gray-800 dark:text-gray-200 text-lg whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Related Content */}
          {post.relatedJob && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Related Job</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{post.relatedJob.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{post.relatedJob.company}</p>
            </div>
          )}

          {post.relatedCourse && (
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">Related Course</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{post.relatedCourse.title}</p>
            </div>
          )}

          {/* Post Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-b dark:border-gray-700 py-3 mb-6">
            <span className="flex items-center">
              <span className="mr-1">👍</span>
              {post.likes.length} likes
            </span>
            <span className="flex items-center">
              <span className="mr-1">💬</span>
              {post.comments.length} comments
            </span>
            <span className="flex items-center">
              <span className="mr-1">👁️</span>
              {post.views} views
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4 mb-8">
            <button
              onClick={handleLike}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              👍 Like
            </button>
            <button
              onClick={() => document.getElementById('comment-input').focus()}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              💬 Comment
            </button>
          </div>

          {/* Comments Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-bold mb-4">
              Comments ({post.comments.length})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleComment} className="mb-6">
              <textarea
                id="comment-input"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Post Comment
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {post.comments.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                post.comments.map((comment) => (
                  <div key={comment._id} className="flex space-x-3">
                    <img
                      src={
                        comment.user.studentProfile?.profilePhoto
                          ? (comment.user.studentProfile.profilePhoto.startsWith('http')
                              ? comment.user.studentProfile.profilePhoto
                              : `http://localhost:5000${comment.user.studentProfile.profilePhoto}`)
                          : comment.user.employerProfile?.logo
                          ? (comment.user.employerProfile.logo.startsWith('http')
                              ? comment.user.employerProfile.logo
                              : `http://localhost:5000${comment.user.employerProfile.logo}`)
                          : 'https://ui-avatars.com/api/?name=User&background=e5e7eb&color=6b7280&size=128'
                      }
                      alt="Commenter"
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">
                            {comment.user.studentProfile
                              ? `${comment.user.studentProfile.firstName} ${comment.user.studentProfile.lastName}`
                              : comment.user.employerProfile?.companyName || comment.user.email}
                          </p>
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
