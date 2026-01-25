'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { courseAPI } from '@/services/api';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;
  
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await courseAPI.getCourse(courseId);
      const courseData = response?.data || response?.course || response;
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
      setMessage({ type: 'error', text: 'Failed to load course details' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setEnrolling(true);
    setMessage({ type: '', text: '' });

    try {
      await courseAPI.enrollInCourse(courseId);
      setMessage({ type: 'success', text: 'Successfully enrolled in course!' });
      loadCourse(); // Reload to update enrollment status
      
      // Redirect to enrollments page after 2 seconds
      setTimeout(() => {
        router.push('/student/enrollments');
      }, 2000);
    } catch (error) {
      console.error('Error enrolling:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to enroll in course' 
      });
    } finally {
      setEnrolling(false);
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
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found</p>
          <button onClick={() => router.push('/courses')} className="btn btn-primary mt-4">
            Browse Courses
          </button>
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
                onClick={() => router.push('/courses')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Courses
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button onClick={handleLogout} className="btn btn-outline text-sm">
                    Logout
                  </button>
                </>
              ) : (
                <a href="/auth/login" className="btn btn-primary text-sm">
                  Login
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="card">
              {course.coverImage && (
                <img 
                  src={course.coverImage} 
                  alt={course.title}
                  className="w-full h-64 object-cover rounded-t-lg"
                />
              )}
              
              <div className="p-6">
                <div className="flex gap-2 mb-3">
                  <span className="badge badge-primary">{course.category}</span>
                  <span className={`badge ${
                    course.level === 'beginner' ? 'badge-success' :
                    course.level === 'intermediate' ? 'badge-warning' :
                    'badge-secondary'
                  }`}>
                    {course.level}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>

                <p className="text-gray-600 text-lg mb-6">
                  {course.description}
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{course.duration?.value} {course.duration?.unit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{course.averageRating?.toFixed(1) || 'N/A'} ({course.totalRatings || 0} ratings)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{course.totalEnrollments || 0} students</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            {course.skillsCovered && course.skillsCovered.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {course.skillsCovered.map((skill, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{skill.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Content */}
            {course.modules && course.modules.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Course Content</h2>
                <div className="space-y-3">
                  {course.modules.map((module, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Module {module.order || idx + 1}: {module.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      {module.lessons && module.lessons.length > 0 && (
                        <p className="text-xs text-gray-500">
                          {module.lessons.length} lessons
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {course.prerequisites.map((prereq, idx) => (
                    <li key={idx}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Enroll Now</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900">
                      {course.pricing?.isFree ? 'Free' : 
                       course.pricing?.amount ? `৳${course.pricing.amount}` : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold text-gray-900">
                      {course.duration?.value} {course.duration?.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {course.level}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Certificate:</span>
                    <span className="font-semibold text-gray-900">
                      {course.certificateAvailable ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {user && user.role === 'student' ? (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn btn-primary w-full"
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                ) : (
                  <a href="/auth/login" className="btn btn-primary w-full">
                    Login to Enroll
                  </a>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Full lifetime access</span>
                    </li>
                    {course.certificateAvailable && (
                      <li className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Certificate of completion</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Access on mobile and desktop</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
