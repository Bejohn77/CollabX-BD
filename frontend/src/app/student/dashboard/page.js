'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { studentAPI, jobAPI, courseAPI } from '@/services/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [profileRes, jobsRes, coursesRes] = await Promise.all([
        studentAPI.getProfile(),
        jobAPI.getRecommendations(),
        courseAPI.getMyEnrollments().catch(() => ({ data: [] }))
      ]);
      
      console.log('Student Dashboard - Profile Response:', profileRes);
      console.log('Student Dashboard - Jobs Response:', jobsRes);
      
      // Extract profile data properly
      const profileData = profileRes?.data || profileRes;
      console.log('📸 Profile Photo Data:', {
        profilePhoto: profileData?.profilePhoto,
        fullURL: profileData?.profilePhoto ? `http://localhost:5000${profileData.profilePhoto}` : 'No photo'
      });
      setProfile(profileData);
      
      // Update user state with profile name if available
      if (profileData?.firstName && profileData?.lastName) {
        setUser(prev => ({
          ...prev,
          firstName: profileData.firstName,
          lastName: profileData.lastName
        }));
      }
      
      setRecommendedJobs(jobsRes.data || jobsRes.jobs || []);
      setEnrolledCourses(coursesRes?.data || coursesRes?.enrollments || coursesRes || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary-600">CollabX BD</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">Student Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              {profile?.profilePhoto && (
                <img
                  src={`http://localhost:5000${profile.profilePhoto}`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary-200"
                />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.firstName || user?.email}
              </span>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className="btn btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Information Card */}
        <div className="card mb-6 bg-gradient-to-r from-primary-50 via-secondary-50 to-accent-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800 border-primary-200 dark:border-primary-700">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {profile?.profilePhoto ? (
                <img
                  src={`http://localhost:5000${profile.profilePhoto}`}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email?.split('@')[0] || 'Student'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span className="font-medium">Email:</span> {user?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">Account Type:</span> Student Account
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-300">Registered Name</p>
              <p className="text-lg font-semibold text-primary-700">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : 'Complete your profile'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completion Banner */}
        {profile && profile.profileCompleteness < 100 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 flex justify-between items-center">
                <p className="text-sm text-yellow-700">
                  Your profile is <strong>{profile.profileCompleteness}%</strong> complete. 
                  Complete your profile to get better job recommendations!
                </p>
                <a 
                  href="/student/profile" 
                  className="ml-4 btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Complete Profile
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Profile Completion</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{profile?.profileCompleteness || 0}%</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-secondary-50 to-accent-50 dark:from-secondary-900/20 dark:to-accent-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Recommended Jobs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{recommendedJobs.length}</p>
              </div>
            </div>
          </div>

          <div className="card cursor-pointer bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20" onClick={() => router.push('/student/enrollments')}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Enrolled Courses</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{enrolledCourses.length}</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Skills</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{profile?.skills?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="card cursor-pointer bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900/20 dark:to-primary-900/20" onClick={() => router.push('/posts')}>
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Community</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Blogs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Jobs */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recommended Jobs for You</h2>
            <a href="/jobs" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View all →
            </a>
          </div>
          
          {recommendedJobs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedJobs.slice(0, 6).map((job) => (
                <div key={job._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    {job.matchScore && (
                      <span className="badge badge-success text-xs">
                        {Math.round(job.matchScore)}% match
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {job.employer?.companyName || 'Company'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="badge badge-info text-xs">{job.jobType}</span>
                    <span className="badge badge-secondary text-xs">{job.workMode}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">
                      {job.salary?.min && job.salary?.max
                        ? `$${job.salary.min}-${job.salary.max}${job.salary.period === 'hourly' ? '/hr' : '/yr'}`
                        : 'Salary not disclosed'}
                    </span>
                    <a
                      href={`/jobs/${job._id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Complete your profile to get personalized job recommendations
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <a href="/student/profile" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Complete Profile</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Add skills, projects & experience</p>
              </div>
            </div>
          </a>

          <a href="/jobs" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Jobs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Find your dream opportunity</p>
              </div>
            </div>
          </a>

          <a href="/courses" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Learn Skills</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Enroll in courses & earn certificates</p>
              </div>
            </div>
          </a>

          <a href="/posts" className="card hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Community Blogs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share & read community posts</p>
              </div>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}
