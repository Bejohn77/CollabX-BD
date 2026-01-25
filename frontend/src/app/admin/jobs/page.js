'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { adminAPI } from '@/services/api';

export default function AdminJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState({});

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

    setUser(parsedUser);
    loadJobs();
  }, [filter]);

  const loadJobs = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await adminAPI.getJobs(params);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId) => {
    if (!confirm('Are you sure you want to approve this job?')) return;
    
    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      await adminAPI.approveJob(jobId);
      alert('Job approved successfully!');
      loadJobs();
    } catch (error) {
      console.error('Error approving job:', error);
      alert('Failed to approve job: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleReject = async (jobId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      await adminAPI.rejectJob(jobId, reason);
      alert('Job rejected successfully!');
      loadJobs();
    } catch (error) {
      console.error('Error rejecting job:', error);
      alert('Failed to reject job: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleDelete = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job permanently?')) return;
    
    setActionLoading(prev => ({ ...prev, [jobId]: true }));
    try {
      await adminAPI.deleteJob(jobId);
      alert('Job deleted successfully!');
      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job: ' + (error.message || 'Unknown error'));
    } finally {
      setActionLoading(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    Cookies.remove('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin/dashboard')} className="text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-primary-600">Job Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button onClick={handleLogout} className="btn btn-outline text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-4 font-medium text-sm ${
              filter === 'all'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`pb-3 px-4 font-medium text-sm ${
              filter === 'pending'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`pb-3 px-4 font-medium text-sm ${
              filter === 'active'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`pb-3 px-4 font-medium text-sm ${
              filter === 'closed'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Closed
          </button>
        </div>

        {/* Jobs List */}
        {jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job._id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {job.employer?.email || 'Unknown Employer'}
                        </p>
                      </div>
                      <span className={`badge text-xs ${
                        job.status === 'active' ? 'badge-success' :
                        job.status === 'pending' ? 'badge-warning' :
                        job.status === 'closed' ? 'badge-secondary' :
                        'badge-danger'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mt-3 line-clamp-2">{job.description}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="badge badge-info text-xs">{job.jobType}</span>
                      <span className="badge badge-info text-xs">{job.workMode}</span>
                      <span className="badge badge-info text-xs">{job.experienceLevel}</span>
                      {job.location?.city && (
                        <span className="badge badge-gray text-xs">📍 {job.location.city}</span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.requiredSkills?.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded">
                          {skill.name}
                        </span>
                      ))}
                      {job.requiredSkills?.length > 5 && (
                        <span className="text-xs text-gray-500">+{job.requiredSkills.length - 5} more</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Posted: {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                  {job.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(job._id)}
                        disabled={actionLoading[job._id]}
                        className="btn btn-success text-sm"
                      >
                        {actionLoading[job._id] ? 'Processing...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(job._id)}
                        disabled={actionLoading[job._id]}
                        className="btn btn-danger text-sm"
                      >
                        {actionLoading[job._id] ? 'Processing...' : '✗ Reject'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => router.push(`/admin/jobs/${job._id}`)}
                    className="btn btn-outline text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    disabled={actionLoading[job._id]}
                    className="btn btn-outline text-sm text-red-600 border-red-600 hover:bg-red-50"
                  >
                    {actionLoading[job._id] ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' ? 'There are no pending jobs to review.' : `No ${filter} jobs available.`}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
