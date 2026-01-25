'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/services/api';

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [reportedPosts, setReportedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, reported
  const [page, setPage] = useState(1);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      router.push('/auth/login');
      return;
    }

    fetchPosts();
  }, [page, activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      if (activeTab === 'reported') {
        const response = await api.get('/admin/posts/reported');
        setReportedPosts(response.data.data || response.data);
      } else {
        const response = await api.get('/posts/feed', { params: { page, limit: 20 } });
        setPosts(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleHidePost = async (postId) => {
    try {
      await api.put(`/admin/posts/${postId}/hide`);
      fetchPosts();
    } catch (err) {
      alert('Failed to hide post: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (err) {
      alert('Failed to delete post: ' + (err.response?.data?.message || err.message));
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

  const postsToDisplay = activeTab === 'reported' ? reportedPosts : posts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Posts Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => {
                  setActiveTab('all');
                  setPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Posts
              </button>
              <button
                onClick={() => {
                  setActiveTab('reported');
                  setPage(1);
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reported'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reported Posts
                {reportedPosts.length > 0 && (
                  <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                    {reportedPosts.length}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
          </div>
        ) : postsToDisplay.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">
              {activeTab === 'reported' ? 'No reported posts' : 'No posts found'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {postsToDisplay.map((post) => (
              <div
                key={post._id}
                className={`bg-white rounded-lg shadow p-6 ${
                  post.isHidden ? 'opacity-50 border-2 border-red-300' : ''
                }`}
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{getAuthorName(post)}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(post.createdAt).toLocaleString()} • {post.postType}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{post.author.email}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.visibility === 'public' ? 'bg-green-100 text-green-800' :
                          post.visibility === 'connections' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.visibility}
                        </span>
                        {post.isHidden && (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            Hidden
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/posts/${post._id}`)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleHidePost(post._id)}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      {post.isHidden ? 'Unhide' : 'Hide'}
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-800 line-clamp-3">{post.content}</p>
                </div>

                {/* Post Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>👍 {post.likes.length} likes</span>
                  <span>💬 {post.comments.length} comments</span>
                  <span>👁️ {post.views} views</span>
                  {post.isReported && (
                    <span className="text-red-600 font-semibold">
                      🚩 {post.reports.length} reports
                    </span>
                  )}
                </div>

                {/* Reports Details (for reported posts) */}
                {activeTab === 'reported' && post.reports && post.reports.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-semibold text-red-900 mb-2">Reports:</h4>
                    <ul className="space-y-2">
                      {post.reports.map((report, idx) => (
                        <li key={idx} className="text-sm text-red-800">
                          <strong>Reason:</strong> {report.reason} 
                          <span className="text-red-600 ml-2">
                            ({new Date(report.reportedAt).toLocaleDateString()})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'all' && !loading && posts.length > 0 && (
          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
