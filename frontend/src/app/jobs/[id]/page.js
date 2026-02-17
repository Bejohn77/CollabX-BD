'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobAPI, applicationAPI } from '../../../services/api';

export default function JobDetailsPage({ params }) {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [application, setApplication] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    customAnswers: []
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [params.id]);

  const loadJobDetails = async () => {
    try {
      const response = await jobAPI.getJobById(params.id);
      console.log('Job Details Response:', response);
      const jobData = response.data || response;
      console.log('Job Data:', jobData);
      setJob(jobData);
      
      // Check if user has already applied
      try {
        const myApplications = await applicationAPI.getMyApplications();
        const existingApplication = myApplications.data?.find(
          app => app.job._id === params.id || app.job === params.id
        );
        if (existingApplication) {
          setHasApplied(true);
          setApplication(existingApplication);
        }
      } catch (error) {
        console.log('Not logged in or no applications');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      alert('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    // Initialize custom answers
    const answers = (job.customQuestions || []).map(q => ({
      question: q.question,
      answer: ''
    }));
    setApplicationData({ ...applicationData, customAnswers: answers });
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      // If a resume file is attached, send multipart/form-data
      if (resumeFile) {
        const formData = new FormData();
        formData.append('coverLetter', applicationData.coverLetter);
        formData.append('customAnswers', JSON.stringify(applicationData.customAnswers || []));
        formData.append('resume', resumeFile);
        await applicationAPI.applyForJob(params.id, formData);
      } else {
        await applicationAPI.applyForJob(params.id, applicationData);
      }
      alert('Application submitted successfully!');
      setShowApplicationModal(false);
      setHasApplied(true);
      loadJobDetails();
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      alert('Only PDF, DOC, DOCX files are allowed for resume.');
      return;
    }
    setResumeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowed.includes(file.type)) {
        alert('Only PDF, DOC, DOCX files are allowed for resume.');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const removeFile = () => setResumeFile(null);

  const handleCustomAnswerChange = (index, value) => {
    const newAnswers = [...applicationData.customAnswers];
    newAnswers[index].answer = value;
    setApplicationData({ ...applicationData, customAnswers: newAnswers });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.push('/jobs')} className="btn btn-primary">
            Browse All Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Job Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
                <span className={`badge ${
                  job.status === 'active' ? 'badge-success' :
                  job.status === 'pending' ? 'badge-warning' : 'badge-secondary'
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {job.employer?.employerProfile?.companyName || 'Company'}
                </span>
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {job.location?.city}, {job.location?.state}
                </span>
                {job.location?.isRemote && (
                  <span className="badge badge-info">Remote</span>
                )}
              </div>
            </div>
            <div className="text-right">
              {job.salaryRange?.min && (
                <p className="text-2xl font-bold text-green-600">
                  ৳{job.salaryRange.min.toLocaleString()} - ৳{job.salaryRange.max.toLocaleString()}
                  <span className="text-sm text-gray-500">/month</span>
                </p>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {hasApplied ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-green-600">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">You've applied to this job</span>
                </div>
                {application && (
                  <span className={`badge ${
                    application.status === 'pending' ? 'badge-warning' :
                    application.status === 'shortlisted' ? 'badge-info' :
                    application.status === 'accepted' ? 'badge-success' : 'badge-secondary'
                  }`}>
                    {application.status}
                  </span>
                )}
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                Apply for this Job
              </button>
            )}
          </div>
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
              <div className="prose max-w-none text-gray-600 whitespace-pre-wrap">
                {job.description || 'No description provided.'}
              </div>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Responsibilities</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Qualifications */}
            {job.qualifications && job.qualifications.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Qualifications</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {job.qualifications.map((qual, index) => (
                    <li key={index}>{qual}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, index) => (
                    <span key={index} className="badge badge-primary">
                      {skill.name} - {skill.level || skill.proficiency}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Benefits</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Details Card */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Job Type</p>
                  <p className="font-medium text-gray-900">{job.jobType}</p>
                </div>
                <div>
                  <p className="text-gray-500">Work Mode</p>
                  <p className="font-medium text-gray-900">{job.workMode || 'office'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Experience Level</p>
                  <p className="font-medium text-gray-900">{job.experienceLevel}</p>
                </div>
                {job.deadline && (
                  <div>
                    <p className="text-gray-500">Application Deadline</p>
                    <p className="font-medium text-gray-900">
                      {new Date(job.deadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">Posted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            {job.employer?.employerProfile && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">About Company</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">
                      {job.employer.employerProfile.companyName}
                    </p>
                  </div>
                  {job.employer.employerProfile.description && (
                    <div>
                      <p className="text-gray-500 mb-1">About</p>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {job.employer.employerProfile.description}
                      </p>
                    </div>
                  )}
                  {job.employer.employerProfile.industry && (
                    <div>
                      <p className="text-gray-500">Industry</p>
                      <p className="font-medium text-gray-900">
                        {job.employer.employerProfile.industry}
                      </p>
                    </div>
                  )}
                  {job.employer.employerProfile.companySize && (
                    <div>
                      <p className="text-gray-500">Company Size</p>
                      <p className="font-medium text-gray-900">
                        {job.employer.employerProfile.companySize}
                      </p>
                    </div>
                  )}
                  {job.employer.employerProfile.website && (
                    <div>
                      <p className="text-gray-500">Website</p>
                      <a 
                        href={job.employer.employerProfile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Apply for {job.title}</h2>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitApplication}>
                {/* Cover Letter */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applicationData.coverLetter}
                    onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                    rows="6"
                    className="input"
                    placeholder="Tell us why you're a great fit for this role..."
                    required
                  />
                </div>

                {/* Custom Questions */}
                {job.customQuestions && job.customQuestions.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Questions</h3>
                    {job.customQuestions.map((question, index) => (
                      <div key={index} className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {question.question}
                          {question.required && <span className="text-red-500"> *</span>}
                        </label>
                        <textarea
                          value={applicationData.customAnswers[index]?.answer || ''}
                          onChange={(e) => handleCustomAnswerChange(index, e.target.value)}
                          rows="3"
                          className="input"
                          placeholder="Your answer..."
                          required={question.required}
                        />
                      </div>
                    ))}
                  </div>
                )}

                    {/* Resume Upload */}
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Resume (PDF/DOC/DOCX)</h3>
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setDragOver(false)}
                        className={`border-dashed border-2 p-4 rounded-md text-center ${dragOver ? 'border-primary-600 bg-primary-50' : 'border-gray-300 bg-white'}`}
                      >
                        <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="hidden" id="resumeInput" />
                        <label htmlFor="resumeInput" className="cursor-pointer block">
                          <div className="text-sm text-gray-600">Drag & drop your resume here, or <span className="text-primary-600 underline">browse</span></div>
                        </label>
                        {resumeFile && (
                          <div className="mt-3 flex items-center justify-between">
                            <div className="text-sm text-gray-700">{resumeFile.name} ({(resumeFile.size/1024).toFixed(0)} KB)</div>
                            <button type="button" onClick={removeFile} className="text-sm text-red-500">Remove</button>
                          </div>
                        )}
                      </div>
                    </div>

                {/* Buttons */}
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowApplicationModal(false)}
                    className="btn btn-secondary"
                    disabled={applying}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={applying}
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
