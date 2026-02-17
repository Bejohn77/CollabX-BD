'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { employerAPI } from '@/services/api';

// Helper function to get the backend URL
const getBackendUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '').replace(/\/$/, '');
};

export default function ApplicationDetailPage({ params }) {
  const router = useRouter();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumePreviewURL, setResumePreviewURL] = useState(null);

  useEffect(() => {
    loadApplicationDetails();
  }, [params.applicationId]);

  const loadApplicationDetails = async () => {
    try {
      // Get all applicants for this job to find our application
      const response = await employerAPI.getApplicants(params.id);
      const applications = response.data?.applications || [];
      const app = applications.find(a => a._id === params.applicationId);
      
      if (app) {
        setApplication(app);
      } else {
        alert('Application not found');
        router.push(`/employer/jobs/${params.id}/applicants`);
      }
    } catch (error) {
      console.error('Error loading application:', error);
      alert('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = () => {
    if (application?.resume?.url) {
      const resumeUrl = application.resume.url.startsWith('http')
        ? application.resume.url
        : `${getBackendUrl()}${application.resume.url}`;
      setResumePreviewURL(resumeUrl);
      setShowResumeModal(true);
    }
  };

  const handleDownloadResume = () => {
    if (application?.resume?.url) {
      const resumeUrl = application.resume.url.startsWith('http')
        ? application.resume.url
        : `${getBackendUrl()}${application.resume.url}`;
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = application.resume.filename || 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Application not found</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Applicants
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {application.student?.studentProfile?.firstName} {application.student?.studentProfile?.lastName}
          </h1>
          <p className="text-gray-600 mt-2">{application.student?.email}</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Applicant Info Card */}
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Application Info</h2>
              </div>
              <span className={`badge ${
                application.status === 'pending' ? 'badge-warning' :
                application.status === 'shortlisted' ? 'badge-info' :
                application.status === 'accepted' ? 'badge-success' : 'badge-secondary'
              }`}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Applied Date</p>
                <p className="font-medium text-gray-900">{new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Match Score</p>
                <p className="font-medium text-gray-900">{application.matchScore}/100</p>
              </div>
            </div>
          </div>

          {/* Resume Card - MAIN SECTION */}
          {application.resume && application.resume.url && (
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">📄 Resume</h2>
                  <p className="text-sm text-gray-700 mb-4">
                    {application.resume.filename || 'Resume.pdf'}
                  </p>
                  {application.resume.uploadedAt && (
                    <p className="text-xs text-gray-600 mb-4">
                      Uploaded: {new Date(application.resume.uploadedAt).toLocaleDateString()}
                    </p>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleViewResume}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Resume
                    </button>
                    <button
                      onClick={handleDownloadResume}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Resume
                    </button>
                  </div>
                </div>
                <div className="hidden sm:flex items-center justify-center w-32 h-32 bg-blue-200 rounded-lg">
                  <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {!application.resume && (
            <div className="card bg-yellow-50 border-2 border-yellow-200">
              <p className="text-yellow-800">ℹ️ No resume uploaded for this application</p>
            </div>
          )}

          {/* Cover Letter Card */}
          {application.coverLetter && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📝 Cover Letter</h2>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                {application.coverLetter}
              </div>
            </div>
          )}

          {/* Custom Answers Card */}
          {application.customAnswers && application.customAnswers.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">❓ Additional Questions</h2>
              <div className="space-y-4">
                {application.customAnswers.map((answer, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">{answer.question}</p>
                    <p className="text-gray-700">{answer.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Card */}
          {application.student?.studentProfile?.skills && application.student.studentProfile.skills.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🛠️ Skills</h2>
              <div className="flex flex-wrap gap-2">
                {application.student.studentProfile.skills.map((skill, index) => (
                  <span key={index} className="badge badge-primary text-sm">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Preview Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {application.resume.filename || 'Resume'}
              </h2>
              <button
                onClick={() => setShowResumeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Resume Preview */}
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center">
              {resumePreviewURL?.endsWith('.pdf') ? (
                <iframe
                  src={`${resumePreviewURL}#toolbar=0`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ minHeight: '600px' }}
                  className="w-full"
                />
              ) : (
                <div className="p-8 bg-white rounded-lg text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={handleDownloadResume}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              <button
                onClick={handleDownloadResume}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Resume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
