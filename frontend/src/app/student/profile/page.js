
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { studentAPI } from '@/services/api';
// ...existing code...

export default function StudentProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilePhoto: '',
    bio: '',
    phone: '',
    location: {
      city: '',
      state: '',
      country: ''
    },
    education: [],
    university: {
      name: '',
      email: '',
      graduationYear: ''
    },
    skills: [],
    projects: [],
    experience: [],
    certifications: [],
    jobPreferences: {
      desiredRoles: [],
      desiredLocations: [],
      expectedSalary: { min: '', max: '', currency: 'BDT' },
      jobType: [],
      willingToRelocate: false
    },
    socialLinks: {
      linkedin: '',
      github: '',
      portfolio: '',
      twitter: ''
    },
    isLookingForJob: true,
    isAvailableForFreelance: false
  });

  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'student') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await studentAPI.getProfile();
      const profile = response?.data || response;
      
      if (profile) {
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          profilePhoto: profile.profilePhoto || '',
          bio: profile.bio || '',
          phone: profile.phone || '',
          location: profile.location || { city: '', state: '', country: '' },
          education: profile.education || [],
          university: profile.university || { name: '', email: '', graduationYear: '' },
          skills: profile.skills || [],
          projects: profile.projects || [],
          experience: profile.experience || [],
          certifications: profile.certifications || [],
          jobPreferences: profile.jobPreferences || {
            desiredRoles: [],
            desiredLocations: [],
            expectedSalary: { min: '', max: '', currency: 'BDT' },
            jobType: [],
            willingToRelocate: false
          },
          socialLinks: profile.socialLinks || { linkedin: '', github: '', portfolio: '', twitter: '' },
          isLookingForJob: profile.isLookingForJob !== undefined ? profile.isLookingForJob : true,
          isAvailableForFreelance: profile.isAvailableForFreelance || false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = type === 'checkbox' ? checked : value;
        return newData;
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please upload a valid image file (JPG, PNG, or GIF)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setProfilePhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData if file is uploaded
      if (profilePhotoFile) {
        console.log('📸 Uploading profile photo:', {
          name: profilePhotoFile.name,
          size: profilePhotoFile.size,
          type: profilePhotoFile.type
        });
        
        const formDataToSend = new FormData();
        formDataToSend.append('profilePhoto', profilePhotoFile);
        
        // Append other fields as JSON strings or individual fields
        Object.keys(formData).forEach(key => {
          if (key !== 'profilePhoto' && formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
            // Skip empty objects and arrays
            if (typeof formData[key] === 'object') {
              const jsonStr = JSON.stringify(formData[key]);
              if (jsonStr !== '{}' && jsonStr !== '[]') {
                formDataToSend.append(key, jsonStr);
              }
            } else {
              formDataToSend.append(key, formData[key]);
            }
          }
        });

        await studentAPI.updateProfile(formDataToSend);
      } else {
        // Remove profilePhoto from data when not uploading file
        const { profilePhoto, ...dataToSend } = formData;
        await studentAPI.updateProfile(dataToSend);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reload profile to get the new image URL
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Array handlers for education
  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        current: false,
        gpa: '',
        description: ''
      }]
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData(prev => {
      const newEducation = [...prev.education];
      newEducation[index] = { ...newEducation[index], [field]: value };
      return { ...prev, education: newEducation };
    });
  };

  const removeEducation = (index) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Array handlers for skills
  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: '', proficiency: 'beginner' }]
    }));
  };

  const updateSkill = (index, field, value) => {
    setFormData(prev => {
      const newSkills = [...prev.skills];
      newSkills[index] = { ...newSkills[index], [field]: value };
      return { ...prev, skills: newSkills };
    });
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Array handlers for experience
  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        company: '',
        position: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
        skills: []
      }]
    }));
  };

  const updateExperience = (index, field, value) => {
    setFormData(prev => {
      const newExperience = [...prev.experience];
      newExperience[index] = { ...newExperience[index], [field]: value };
      return { ...prev, experience: newExperience };
    });
  };

  const removeExperience = (index) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  // Array handlers for projects
  const addProject = () => {
    setFormData(prev => ({
      ...prev,
      projects: [...prev.projects, {
        title: '',
        description: '',
        technologies: [],
        startDate: '',
        endDate: '',
        current: false,
        projectUrl: '',
        githubUrl: '',
        category: 'personal'
      }]
    }));
  };

  const updateProject = (index, field, value) => {
    setFormData(prev => {
      const newProjects = [...prev.projects];
      newProjects[index] = { ...newProjects[index], [field]: value };
      return { ...prev, projects: newProjects };
    });
  };

  const removeProject = (index) => {
    setFormData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index)
    }));
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
          <p className="mt-4 text-gray-600">Loading profile...</p>
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
              <button
                onClick={() => router.push('/student/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary-600">My Profile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn btn-primary btn-sm">
                  Edit Profile
                </button>
              ) : (
                <button onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                  Cancel Edit
                </button>
              )}
              <button onClick={handleLogout} className="btn btn-outline text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        {!isEditing && (
          <div className="mb-6">
            {/* View-only profile details and all sections */}
            <div className="card mb-6">
              <div className="flex items-center space-x-6">
                <div>
                  {formData.profilePhoto ? (
                    <img src={`http://localhost:5000${formData.profilePhoto}`} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl">
                      {formData.firstName?.charAt(0) || 'S'}{formData.lastName?.charAt(0) || ''}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{formData.firstName} {formData.lastName}</h2>
                  <p className="text-sm text-gray-600 mt-1">{formData.bio}</p>
                  <p className="text-sm text-gray-500 mt-2">{formData.location?.city}, {formData.location?.state}, {formData.location?.country}</p>
                  <p className="text-sm text-gray-500 mt-2">Phone: {formData.phone}</p>
                  <p className="text-sm text-gray-500 mt-2">University: {formData.university?.name} ({formData.university?.graduationYear})</p>
                  <p className="text-sm text-gray-500 mt-2">Email: {formData.university?.email}</p>
                  <div className="mt-2 flex gap-2">
                    {formData.socialLinks?.linkedin && <a href={formData.socialLinks.linkedin} target="_blank" rel="noopener" className="text-blue-600 underline">LinkedIn</a>}
                    {formData.socialLinks?.github && <a href={formData.socialLinks.github} target="_blank" rel="noopener" className="text-gray-800 underline">GitHub</a>}
                    {formData.socialLinks?.portfolio && <a href={formData.socialLinks.portfolio} target="_blank" rel="noopener" className="text-green-600 underline">Portfolio</a>}
                  </div>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-2">Education</h3>
              {formData.education?.length ? (
                <ul className="space-y-2">
                  {formData.education.map((edu, idx) => (
                    <li key={idx} className="border-b pb-2">
                      <span className="font-semibold">{edu.institution}</span> — {edu.degree}, {edu.fieldOfStudy} ({edu.startDate?.slice(0,7)} - {edu.current ? 'Present' : edu.endDate?.slice(0,7)})<br />
                      <span className="text-xs text-gray-500">GPA: {edu.gpa}</span>
                      {edu.description && <div className="text-xs text-gray-600 mt-1">{edu.description}</div>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No education added.</p>}
            </div>

            {/* Skills */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-2">Skills</h3>
              {formData.skills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, idx) => (
                    <span key={idx} className="badge badge-primary">{skill.name} ({skill.proficiency})</span>
                  ))}
                </div>
              ) : <p className="text-gray-500">No skills added.</p>}
            </div>

            {/* Experience */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-2">Work Experience</h3>
              {formData.experience?.length ? (
                <ul className="space-y-2">
                  {formData.experience.map((exp, idx) => (
                    <li key={idx} className="border-b pb-2">
                      <span className="font-semibold">{exp.position}</span> at {exp.company} ({exp.startDate?.slice(0,7)} - {exp.current ? 'Present' : exp.endDate?.slice(0,7)})<br />
                      <span className="text-xs text-gray-500">Location: {exp.location}</span>
                      {exp.description && <div className="text-xs text-gray-600 mt-1">{exp.description}</div>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No experience added.</p>}
            </div>

            {/* Projects */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-2">Projects</h3>
              {formData.projects?.length ? (
                <ul className="space-y-2">
                  {formData.projects.map((proj, idx) => (
                    <li key={idx} className="border-b pb-2">
                      <span className="font-semibold">{proj.title}</span> ({proj.category})<br />
                      <span className="text-xs text-gray-500">{proj.technologies?.join(', ')}</span><br />
                      {proj.description && <div className="text-xs text-gray-600 mt-1">{proj.description}</div>}
                      {proj.projectUrl && <a href={proj.projectUrl} target="_blank" rel="noopener" className="text-blue-600 underline mr-2">Project Link</a>}
                      {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noopener" className="text-gray-800 underline">GitHub</a>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-gray-500">No projects added.</p>}
            </div>

            {/* Job Preferences */}
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-2">Job Preferences</h3>
              <ul className="space-y-1">
                <li>Desired Roles: {formData.jobPreferences?.desiredRoles?.join(', ') || 'N/A'}</li>
                <li>Desired Locations: {formData.jobPreferences?.desiredLocations?.join(', ') || 'N/A'}</li>
                <li>Expected Salary: {formData.jobPreferences?.expectedSalary?.min} - {formData.jobPreferences?.expectedSalary?.max} {formData.jobPreferences?.expectedSalary?.currency || 'BDT'}</li>
                <li>Preferred Job Types: {formData.jobPreferences?.jobType?.join(', ') || 'N/A'}</li>
                <li>Willing to Relocate: {formData.jobPreferences?.willingToRelocate ? 'Yes' : 'No'}</li>
                <li>Looking for Job: {formData.isLookingForJob ? 'Yes' : 'No'}</li>
                <li>Available for Freelance: {formData.isAvailableForFreelance ? 'Yes' : 'No'}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['personal', 'education', 'skills', 'experience', 'projects', 'preferences'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  <div className="flex items-center space-x-4">
                    {(profilePhotoPreview || formData.profilePhoto) && (
                      <img
                        src={profilePhotoPreview || `http://localhost:5000${formData.profilePhoto}`}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                      />
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="input"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Upload JPG, PNG, or GIF (max 5MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    className="input"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input"
                    placeholder="+880 1234 567890"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleChange}
                      className="input"
                      placeholder="Dhaka"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State/Division
                    </label>
                    <input
                      type="text"
                      name="location.state"
                      value={formData.location.state}
                      onChange={handleChange}
                      className="input"
                      placeholder="Dhaka Division"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleChange}
                      className="input"
                      placeholder="Bangladesh"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      University Name
                    </label>
                    <input
                      type="text"
                      name="university.name"
                      value={formData.university.name}
                      onChange={handleChange}
                      className="input"
                      placeholder="University of Frontier Technology, Bangladesh"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      name="university.graduationYear"
                      value={formData.university.graduationYear}
                      onChange={handleChange}
                      min="2000"
                      max="2050"
                      className="input"
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    University Email
                  </label>
                  <input
                    type="email"
                    name="university.email"
                    value={formData.university.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="student@university.edu"
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Social Links</h3>
                  <input
                    type="url"
                    name="socialLinks.linkedin"
                    value={formData.socialLinks.linkedin}
                    onChange={handleChange}
                    className="input"
                    placeholder="LinkedIn URL"
                  />
                  <input
                    type="url"
                    name="socialLinks.github"
                    value={formData.socialLinks.github}
                    onChange={handleChange}
                    className="input"
                    placeholder="GitHub URL"
                  />
                  <input
                    type="url"
                    name="socialLinks.portfolio"
                    value={formData.socialLinks.portfolio}
                    onChange={handleChange}
                    className="input"
                    placeholder="Portfolio URL"
                  />
                </div>

                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isLookingForJob"
                      checked={formData.isLookingForJob}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Looking for job opportunities</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailableForFreelance"
                      checked={formData.isAvailableForFreelance}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available for freelance</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Education Tab */}
          {activeTab === 'education' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Education</h2>
                <button type="button" onClick={addEducation} className="btn btn-outline text-sm">
                  + Add Education
                </button>
              </div>
              
              {formData.education.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No education added yet</p>
              ) : (
                <div className="space-y-6">
                  {formData.education.map((edu, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-gray-900">Education #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          className="input"
                          placeholder="Institution *"
                          required
                        />
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          className="input"
                          placeholder="Degree *"
                          required
                        />
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)}
                          className="input"
                          placeholder="Field of Study"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={edu.gpa}
                          onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                          className="input"
                          placeholder="GPA (e.g., 3.75)"
                        />
                        <input
                          type="month"
                          value={edu.startDate ? edu.startDate.substring(0, 7) : ''}
                          onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                          className="input"
                          placeholder="Start Date"
                        />
                        <input
                          type="month"
                          value={edu.endDate ? edu.endDate.substring(0, 7) : ''}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          className="input"
                          placeholder="End Date"
                          disabled={edu.current}
                        />
                        <label className="flex items-center col-span-2">
                          <input
                            type="checkbox"
                            checked={edu.current}
                            onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Currently studying here</span>
                        </label>
                        <textarea
                          value={edu.description}
                          onChange={(e) => updateEducation(index, 'description', e.target.value)}
                          className="input col-span-2"
                          rows={2}
                          placeholder="Description"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
                <button type="button" onClick={addSkill} className="btn btn-outline text-sm">
                  + Add Skill
                </button>
              </div>
              
              {formData.skills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No skills added yet</p>
              ) : (
                <div className="space-y-3">
                  {formData.skills.map((skill, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                        className="input flex-1"
                        placeholder="Skill name (e.g., JavaScript)"
                        required
                      />
                      <select
                        value={skill.proficiency}
                        onChange={(e) => updateSkill(index, 'proficiency', e.target.value)}
                        className="input w-40"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="btn btn-outline text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === 'experience' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
                <button type="button" onClick={addExperience} className="btn btn-outline text-sm">
                  + Add Experience
                </button>
              </div>
              
              {formData.experience.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No experience added yet</p>
              ) : (
                <div className="space-y-6">
                  {formData.experience.map((exp, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-gray-900">Experience #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, 'company', e.target.value)}
                          className="input"
                          placeholder="Company"
                        />
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => updateExperience(index, 'position', e.target.value)}
                          className="input"
                          placeholder="Position"
                        />
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => updateExperience(index, 'location', e.target.value)}
                          className="input"
                          placeholder="Location"
                        />
                        <input
                          type="month"
                          value={exp.startDate ? exp.startDate.substring(0, 7) : ''}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                          className="input"
                          placeholder="Start Date"
                        />
                        <input
                          type="month"
                          value={exp.endDate ? exp.endDate.substring(0, 7) : ''}
                          onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          className="input"
                          placeholder="End Date"
                          disabled={exp.current}
                        />
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Currently working here</span>
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, 'description', e.target.value)}
                          className="input col-span-2"
                          rows={3}
                          placeholder="Job description and responsibilities"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
                <button type="button" onClick={addProject} className="btn btn-outline text-sm">
                  + Add Project
                </button>
              </div>
              
              {formData.projects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No projects added yet</p>
              ) : (
                <div className="space-y-6">
                  {formData.projects.map((project, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-medium text-gray-900">Project #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeProject(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={project.title}
                          onChange={(e) => updateProject(index, 'title', e.target.value)}
                          className="input col-span-2"
                          placeholder="Project Title *"
                          required
                        />
                        <textarea
                          value={project.description}
                          onChange={(e) => updateProject(index, 'description', e.target.value)}
                          className="input col-span-2"
                          rows={3}
                          placeholder="Project Description"
                        />
                        <input
                          type="text"
                          value={project.technologies ? project.technologies.join(', ') : ''}
                          onChange={(e) => updateProject(index, 'technologies', e.target.value.split(',').map(t => t.trim()))}
                          className="input col-span-2"
                          placeholder="Technologies (comma-separated, e.g., React, Node.js, MongoDB)"
                        />
                        <input
                          type="url"
                          value={project.projectUrl}
                          onChange={(e) => updateProject(index, 'projectUrl', e.target.value)}
                          className="input"
                          placeholder="Project URL"
                        />
                        <input
                          type="url"
                          value={project.githubUrl}
                          onChange={(e) => updateProject(index, 'githubUrl', e.target.value)}
                          className="input"
                          placeholder="GitHub URL"
                        />
                        <select
                          value={project.category}
                          onChange={(e) => updateProject(index, 'category', e.target.value)}
                          className="input"
                        >
                          <option value="personal">Personal</option>
                          <option value="academic">Academic</option>
                          <option value="freelance">Freelance</option>
                          <option value="internship">Internship</option>
                        </select>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={project.current}
                            onChange={(e) => updateProject(index, 'current', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Ongoing project</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Job Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Roles (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.jobPreferences?.desiredRoles || []).join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...(prev.jobPreferences || {}),
                        desiredRoles: e.target.value.split(',').map(r => r.trim()).filter(Boolean)
                      }
                    }))}
                    className="input"
                    placeholder="e.g., Software Engineer, Frontend Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desired Locations (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={(formData.jobPreferences?.desiredLocations || []).join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...(prev.jobPreferences || {}),
                        desiredLocations: e.target.value.split(',').map(l => l.trim()).filter(Boolean)
                      }
                    }))}
                    className="input"
                    placeholder="e.g., Dhaka, Remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Salary (BDT/month)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={formData.jobPreferences?.expectedSalary?.min || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        jobPreferences: {
                          ...(prev.jobPreferences || {}),
                          expectedSalary: {
                            ...(prev.jobPreferences?.expectedSalary || {}),
                            min: e.target.value
                          }
                        }
                      }))}
                      className="input"
                      placeholder="Minimum (e.g., 30000)"
                    />
                    <input
                      type="number"
                      value={formData.jobPreferences?.expectedSalary?.max || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        jobPreferences: {
                          ...(prev.jobPreferences || {}),
                          expectedSalary: {
                            ...(prev.jobPreferences?.expectedSalary || {}),
                            max: e.target.value
                          }
                        }
                      }))}
                      className="input"
                      placeholder="Maximum (e.g., 50000)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Job Types
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['full-time', 'part-time', 'internship', 'contract', 'freelance'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={(formData.jobPreferences?.jobType || []).includes(type)}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              jobPreferences: {
                                ...(prev.jobPreferences || {}),
                                jobType: e.target.checked
                                  ? [...(prev.jobPreferences?.jobType || []), type]
                                  : (prev.jobPreferences?.jobType || []).filter(t => t !== type)
                              }
                            }));
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.jobPreferences?.willingToRelocate || false}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      jobPreferences: {
                        ...(prev.jobPreferences || {}),
                        willingToRelocate: e.target.checked
                      }
                    }))}
                    className="rounded border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Willing to relocate</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/student/dashboard')}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}
