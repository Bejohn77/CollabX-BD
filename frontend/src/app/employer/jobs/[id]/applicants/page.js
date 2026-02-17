'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { employerAPI } from '../../../../../services/api';

// Helper function to get the API base URL (without /api)
const getBackendUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '').replace(/\/$/, '');
};

export default function JobApplicantsPage({ params }) {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    loadApplicants();
  }, [params.id]);

  const loadApplicants = async () => {
    try {
      const response = await employerAPI.getApplicants(params.id);
      console.log('Applicants Response:', response);
      const data = response.data || response;
      setJob(data.job);
      setApplicants(data.applications || []);
    } catch (error) {
      console.error('Error loading applicants:', error);
      alert('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    if (updatingStatus) return;
    
    setUpdatingStatus(applicationId);
    try {
      await employerAPI.updateApplicationStatus(applicationId, { status: newStatus });
      alert(`Application ${newStatus} successfully!`);
      loadApplicants();
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update application status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredApplicants = applicants.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusCounts = {
    all: applicants.length,
    pending: applicants.filter(a => a.status === 'pending').length,
    shortlisted: applicants.filter(a => a.status === 'shortlisted').length,
    accepted: applicants.filter(a => a.status === 'accepted').length,
    rejected: applicants.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/employer/dashboard')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Applicants for {job?.title}</h1>
          <p className="text-gray-600 mt-2">
            {applicants.length} total {applicants.length === 1 ? 'application' : 'applications'}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="card mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'shortlisted', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
              </button>
            ))}
          </div>
        </div>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applicants</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' ? 'No one has applied yet' : `No ${filter} applications`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplicants.map((application) => (
              <div key={application._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {application.student?.studentProfile?.firstName} {application.student?.studentProfile?.lastName}
                      </h3>
                      <span className={`badge ${
                        application.status === 'pending' ? 'badge-warning' :
                        application.status === 'shortlisted' ? 'badge-info' :
                        application.status === 'accepted' ? 'badge-success' : 'badge-secondary'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {application.student?.email}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Applied {new Date(application.appliedAt || application.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Cover Letter */}
                    {application.coverLetter && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Cover Letter</h4>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                          {application.coverLetter}
                        </p>
                      </div>
                    )}

                    {/* Resume/CV */}
                    {application.resume && application.resume.url && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Resume</h4>
                        <a
                          href={
                            application.resume.url.startsWith('http')
                              ? application.resume.url
                              : `${getBackendUrl()}${application.resume.url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Download {application.resume.filename || 'Resume'}
                        </a>
                        {application.resume.uploadedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded {new Date(application.resume.uploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Custom Answers */}
                    {application.customAnswers && application.customAnswers.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Answers</h4>
                        <div className="space-y-2">
                          {application.customAnswers.map((answer, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-700 mb-1">{answer.question}</p>
                              <p className="text-sm text-gray-600">{answer.answer}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {application.student?.studentProfile?.skills && application.student.studentProfile.skills.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.student.studentProfile.skills.slice(0, 10).map((skill, index) => (
                            <span key={index} className="badge badge-primary text-xs">
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex flex-col gap-2">
                    {/* View Full Application */}
                    <button
                      onClick={() => router.push(`/employer/jobs/${params.id}/applicants/${application._id}`)}
                      className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>

                    {application.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'shortlisted')}
                          disabled={updatingStatus === application._id}
                          className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {updatingStatus === application._id ? 'Updating...' : 'Shortlist'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'rejected')}
                          disabled={updatingStatus === application._id}
                          className="btn btn-sm btn-secondary"
                        >
                          {updatingStatus === application._id ? 'Updating...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {application.status === 'shortlisted' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'accepted')}
                          disabled={updatingStatus === application._id}
                          className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                        >
                          {updatingStatus === application._id ? 'Updating...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application._id, 'rejected')}
                          disabled={updatingStatus === application._id}
                          className="btn btn-sm btn-secondary"
                        >
                          {updatingStatus === application._id ? 'Updating...' : 'Reject'}
                        </button>
                      </>
                    )}
                    {(application.status === 'accepted' || application.status === 'rejected') && (
                      <span className="text-sm text-gray-500 italic">
                        {application.status === 'accepted' ? 'Hired' : 'Rejected'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
