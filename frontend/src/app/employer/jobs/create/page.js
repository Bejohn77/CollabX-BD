'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { employerAPI } from '@/services/api';

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobType: 'full-time',
    workMode: 'office',
    experienceLevel: 'entry',
    salaryRange: {
      min: '',
      max: '',
      currency: 'BDT'
    },
    location: {
      city: '',
      state: '',
      country: '',
      remote: false
    },
    requiredSkills: [],
    responsibilities: [''],
    qualifications: [''],
    benefits: [''],
    applicationDeadline: '',
    numberOfOpenings: 1
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'employer') {
      router.push('/auth/login');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleArrayChange = (index, value, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (index, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.requiredSkills.find(s => s.name === skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, { name: skillInput.trim(), level: 'intermediate' }]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillName) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s.name !== skillName)
    }));
  };

  const updateSkillLevel = (skillName, level) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map(s => 
        s.name === skillName ? { ...s, level } : s
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Job title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Job description is required');
      }
      if (formData.requiredSkills.length === 0) {
        throw new Error('At least one required skill is needed');
      }

      // Clean up the data
      const jobData = {
        ...formData,
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        qualifications: formData.qualifications.filter(q => q.trim()),
        benefits: formData.benefits.filter(b => b.trim()),
        salaryRange: {
          ...formData.salaryRange,
          min: Number(formData.salaryRange.min) || undefined,
          max: Number(formData.salaryRange.max) || undefined
        },
        numberOfOpenings: Number(formData.numberOfOpenings)
      };

      // Remove empty location fields
      if (!jobData.location.city) delete jobData.location.city;
      if (!jobData.location.state) delete jobData.location.state;
      if (!jobData.location.country) delete jobData.location.country;

      console.log('Submitting job data:', jobData);
      const response = await employerAPI.createJob(jobData);
      console.log('Job created:', response);
      router.push('/employer/dashboard');
    } catch (err) {
      console.error('Job creation error:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create job. Please try again.';
      
      if (err?.errors && Array.isArray(err.errors)) {
        // Validation errors from express-validator
        errorMessage = err.errors.map(e => e.msg).join(', ');
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-primary-600">Post a New Job</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input"
                  placeholder="Describe the role, team, and what the candidate will be doing..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleChange}
                    required
                    className="input"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Work Mode
                  </label>
                  <select
                    name="workMode"
                    value={formData.workMode}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience Level
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., San Francisco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., California"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="location.country"
                    value={formData.location.country}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., USA"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="location.remote"
                  checked={formData.location.remote}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Remote position (no physical location)
                </label>
              </div>
            </div>
          </div>

          {/* Salary */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Salary Range</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum (BDT/month)
                </label>
                <input
                  type="number"
                  name="salaryRange.min"
                  value={formData.salaryRange.min}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  placeholder="30000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum (BDT/month)
                </label>
                <input
                  type="number"
                  name="salaryRange.max"
                  value={formData.salaryRange.max}
                  onChange={handleChange}
                  min="0"
                  className="input"
                  placeholder="50000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  name="salaryRange.currency"
                  value={formData.salaryRange.currency}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="BDT">BDT (Bangladeshi Taka)</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Required Skills <span className="text-red-500">*</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="input flex-1"
                  placeholder="Type a skill and press Enter"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="btn btn-outline"
                >
                  Add
                </button>
              </div>

              {formData.requiredSkills.length > 0 && (
                <div className="space-y-2">
                  {formData.requiredSkills.map((skill) => (
                    <div key={skill.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-1 font-medium">{skill.name}</span>
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkillLevel(skill.name, e.target.value)}
                        className="input-sm"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {formData.requiredSkills.length === 0 && (
                <p className="text-sm text-gray-500">Add at least one required skill</p>
              )}
            </div>
          </div>

          {/* Responsibilities */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h2>
            
            <div className="space-y-2">
              {formData.responsibilities.map((resp, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'responsibilities')}
                    className="input flex-1"
                    placeholder="e.g., Design and implement new features"
                  />
                  {formData.responsibilities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'responsibilities')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('responsibilities')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Responsibility
              </button>
            </div>
          </div>

          {/* Qualifications */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Qualifications</h2>
            
            <div className="space-y-2">
              {formData.qualifications.map((qual, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={qual}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'qualifications')}
                    className="input flex-1"
                    placeholder="e.g., Bachelor's degree in Computer Science"
                  />
                  {formData.qualifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'qualifications')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('qualifications')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Qualification
              </button>
            </div>
          </div>

          {/* Benefits */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
            
            <div className="space-y-2">
              {formData.benefits.map((benefit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={benefit}
                    onChange={(e) => handleArrayChange(index, e.target.value, 'benefits')}
                    className="input flex-1"
                    placeholder="e.g., Health insurance"
                  />
                  {formData.benefits.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem(index, 'benefits')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('benefits')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                + Add Benefit
              </button>
            </div>
          </div>

          {/* Additional Details */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="applicationDeadline"
                  value={formData.applicationDeadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Openings
                </label>
                <input
                  type="number"
                  name="numberOfOpenings"
                  value={formData.numberOfOpenings}
                  onChange={handleChange}
                  min="1"
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || formData.requiredSkills.length === 0}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                'Post Job'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
