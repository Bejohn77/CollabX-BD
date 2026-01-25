'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminAPI } from '../../../services/api';

export default function AdminEmployersPage() {
  const router = useRouter();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    loadEmployers();
  }, []);

  const loadEmployers = async () => {
    try {
      const response = await adminAPI.getUsers({ role: 'employer' });
      console.log('Employers Response:', response);
      const data = response.data || response;
      const employersList = data.users || data;
      console.log('Employers List:', employersList);
      setEmployers(employersList || []);
    } catch (error) {
      console.error('Error loading employers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (userId) => {
    if (verifying || !confirm('Are you sure you want to verify this company?')) return;
    
    setVerifying(userId);
    try {
      await adminAPI.verifyEmployer(userId);
      alert('Company verified successfully!');
      loadEmployers();
    } catch (error) {
      console.error('Error verifying employer:', error);
      alert(error.response?.data?.message || 'Failed to verify company');
    } finally {
      setVerifying(null);
    }
  };

  const handleUnverify = async (userId) => {
    if (verifying || !confirm('Are you sure you want to remove verification from this company?')) return;
    
    setVerifying(userId);
    try {
      await adminAPI.unverifyEmployer(userId);
      alert('Verification removed successfully!');
      loadEmployers();
    } catch (error) {
      console.error('Error removing verification:', error);
      alert(error.response?.data?.message || 'Failed to remove verification');
    } finally {
      setVerifying(null);
    }
  };

  const filteredEmployers = employers.filter(emp => {
    if (filter === 'all') return true;
    if (filter === 'verified') return emp.employerProfile?.isVerified;
    if (filter === 'unverified') return !emp.employerProfile?.isVerified;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const verifiedCount = employers.filter(e => e.employerProfile?.isVerified).length;
  const unverifiedCount = employers.length - verifiedCount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and verify company profiles
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Companies</p>
                <p className="text-2xl font-semibold text-gray-900">{employers.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Verified</p>
                <p className="text-2xl font-semibold text-gray-900">{verifiedCount}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Pending Verification</p>
                <p className="text-2xl font-semibold text-gray-900">{unverifiedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="card mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({employers.length})
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'verified'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Verified ({verifiedCount})
            </button>
            <button
              onClick={() => setFilter('unverified')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unverified'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({unverifiedCount})
            </button>
          </div>
        </div>

        {/* Employers Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Industry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployers.map((employer) => (
                  <tr key={employer._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {employer.employerProfile?.companyName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employer.employerProfile?.companySize || 'Size not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employer.employerProfile?.industry || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employer.employerProfile?.activeJobs || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employer.employerProfile?.isVerified ? (
                        <span className="badge badge-success">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {employer.employerProfile?.isVerified ? (
                        <button
                          onClick={() => handleUnverify(employer._id)}
                          disabled={verifying === employer._id}
                          className="text-red-600 hover:text-red-900"
                        >
                          {verifying === employer._id ? 'Processing...' : 'Remove Verification'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerify(employer._id)}
                          disabled={verifying === employer._id}
                          className="text-green-600 hover:text-green-900"
                        >
                          {verifying === employer._id ? 'Processing...' : 'Verify'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredEmployers.length === 0 && (
          <div className="card text-center py-12 mt-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No companies registered yet' : `No ${filter} companies`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
