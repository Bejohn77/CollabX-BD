'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { employerAPI } from '@/services/api';

export default function EmployerProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    companySize: '',
    industry: '',
    foundedYear: '',
    contactPerson: '',
    headquarters: '',
    locations: [],
    description: '',
    website: '',
    socialLinks: {
      linkedin: '',
      twitter: '',
      facebook: ''
    },
    hiringFor: []
  });

  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'employer') {
      router.push('/auth/login');
      return;
    }

    setUser(parsedUser);
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await employerAPI.getProfile();
      const profile = response?.data || response;
      
      if (profile) {
        setFormData({
          companyName: profile.companyName || '',
          companyLogo: profile.companyLogo || '',
          companySize: profile.companySize || '',
          industry: profile.industry || '',
          foundedYear: profile.foundedYear || '',
          contactPerson: profile.contactPerson || '',
          // Convert headquarters object to string if needed
          headquarters: typeof profile.headquarters === 'string' 
            ? profile.headquarters 
            : (profile.headquarters?.city || ''),
          // Convert location objects to strings for display
          locations: (profile.locations || []).map(loc => {
            if (typeof loc === 'string') return loc;
            const parts = [loc.city, loc.state, loc.country].filter(Boolean);
            return parts.join(', ');
          }),
          description: profile.description || '',
          website: profile.website || '',
          socialLinks: {
            linkedin: profile.socialLinks?.linkedin || '',
            twitter: profile.socialLinks?.twitter || '',
            facebook: profile.socialLinks?.facebook || ''
          },
          hiringFor: profile.hiringFor || []
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
    const { name, value } = e.target;
    
    if (name.startsWith('socialLinks.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Please upload a valid image file (JPG, PNG, GIF, or SVG)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }

      setCompanyLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Clean up and format data for backend
      const cleanData = {
        ...formData,
        // Convert location strings to proper format
        locations: formData.locations
          .filter(loc => loc.trim() !== '')
          .map(loc => {
            // If it's already an object, keep it
            if (typeof loc === 'object' && loc.city) {
              return loc;
            }
            // Otherwise, parse the string (e.g., "Dhaka, Bangladesh")
            const parts = loc.split(',').map(p => p.trim());
            return {
              city: parts[0] || '',
              state: parts[1] || '',
              country: parts[2] || parts[1] || ''
            };
          }),
        hiringFor: formData.hiringFor.filter(role => role.trim() !== ''),
        // Simplify headquarters to just a string if it's not already
        headquarters: typeof formData.headquarters === 'string' 
          ? formData.headquarters 
          : (formData.headquarters?.city || '')
      };

      // Create FormData if file is uploaded
      if (companyLogoFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('companyLogo', companyLogoFile);
        
        // Append other fields
        Object.keys(cleanData).forEach(key => {
          if (key !== 'companyLogo' && cleanData[key] !== null && cleanData[key] !== undefined && cleanData[key] !== '') {
            // Skip empty objects and arrays
            if (typeof cleanData[key] === 'object') {
              const jsonStr = JSON.stringify(cleanData[key]);
              if (jsonStr !== '{}' && jsonStr !== '[]') {
                formDataToSend.append(key, jsonStr);
              }
            } else {
              formDataToSend.append(key, cleanData[key]);
            }
          }
        });

        await employerAPI.updateProfile(formDataToSend);
      } else {
        // Remove companyLogo from data when not uploading file
        const { companyLogo, ...dataToSend } = cleanData;
        await employerAPI.updateProfile(dataToSend);
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Reload profile to get the new image URL
      await loadProfile();
      
      // Scroll to top to show message
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
                onClick={() => router.push('/employer/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-primary-600">Company Profile</h1>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Tech Solutions Inc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center space-x-4">
                  {/* Logo Preview */}
                  {(companyLogoPreview || formData.companyLogo) && (
                    <img
                      src={companyLogoPreview || formData.companyLogo}
                      alt="Company Logo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  )}
                  
                  {/* File Input */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100 cursor-pointer"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload JPG, PNG, GIF, or SVG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Retail">Retail</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    name="foundedYear"
                    value={formData.foundedYear}
                    onChange={handleChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    className="input"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="input"
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Headquarters
                </label>
                <input
                  type="text"
                  name="headquarters"
                  value={formData.headquarters}
                  onChange={handleChange}
                  className="input"
                  placeholder="Dhaka, Bangladesh"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input"
                  placeholder="Tell us about your company, mission, values, and culture..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.description.length} characters
                </p>
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Locations</h2>
            
            {formData.locations.map((location, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => handleArrayChange('locations', index, e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Dhaka, Bangladesh"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('locations', index)}
                  className="btn btn-outline text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => addArrayItem('locations')}
              className="btn btn-outline text-sm"
            >
              + Add Location
            </button>
          </div>

          {/* Contact & Social */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact & Social Links</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://www.yourcompany.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="socialLinks.linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://www.linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  name="socialLinks.twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://twitter.com/yourcompany"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  name="socialLinks.facebook"
                  value={formData.socialLinks.facebook}
                  onChange={handleChange}
                  className="input"
                  placeholder="https://www.facebook.com/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Hiring For */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Currently Hiring For</h2>
            <p className="text-sm text-gray-600 mb-4">
              List the roles you're actively hiring for
            </p>
            
            {formData.hiringFor.map((role, index) => (
              <div key={index} className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={role}
                  onChange={(e) => handleArrayChange('hiringFor', index, e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., Software Engineer, Marketing Manager"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('hiringFor', index)}
                  className="btn btn-outline text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
            
            <button
              type="button"
              onClick={() => addArrayItem('hiringFor')}
              className="btn btn-outline text-sm"
            >
              + Add Role
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/employer/dashboard')}
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
      </main>
    </div>
  );
}
