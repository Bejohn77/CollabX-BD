'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { courseAPI, studentAPI } from '@/services/api';

export default function StudentEnrollmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    if (parsedUser.role !== 'student') {
      router.push('/');
      return;
    }

    loadEnrollments();
  }, []);

  const loadEnrollments = async () => {
    try {
      const [enrollmentsRes, profileRes] = await Promise.all([
        courseAPI.getMyEnrollments(),
        studentAPI.getProfile().catch(() => null)
      ]);
      
      const enrollmentsData = enrollmentsRes?.data || enrollmentsRes?.enrollments || enrollmentsRes || [];
      setEnrollments(enrollmentsData);
      
      // Get profile data and update user with name
      const profileData = profileRes?.data || profileRes;
      if (profileData) {
        setProfile(profileData);
        if (profileData.firstName && profileData.lastName) {
          setUser(prev => ({
            ...prev,
            firstName: profileData.firstName,
            lastName: profileData.lastName
          }));
        }
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
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
          <p className="mt-4 text-gray-600">Loading enrollments...</p>
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
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email}
              </span>
              <button onClick={handleLogout} className="btn btn-outline text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
          </p>
          <button
            onClick={() => router.push('/courses')}
            className="btn btn-primary"
          >
            Browse More Courses
          </button>
        </div>

        {/* Enrollments List */}
        {enrollments.length === 0 ? (
          <div className="card text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
            <p className="text-gray-600 mb-6">
              Start learning by enrolling in your first course
            </p>
            <button
              onClick={() => router.push('/courses')}
              className="btn btn-primary mx-auto"
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              const progress = enrollment.progress || 0;
              const completedLessons = enrollment.completedLessons?.length || 0;
              const totalLessons = course.modules?.reduce((sum, module) => 
                sum + (module.lessons?.length || 0), 0) || 0;

              return (
                <div key={enrollment._id} className="card group hover:shadow-xl transition-shadow">
                  {/* Course Image */}
                  {course.coverImage && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={course.coverImage} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {enrollment.completed && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Completed
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex gap-2 mb-2">
                      <span className="badge badge-primary text-xs">{course.category}</span>
                      <span className={`badge text-xs ${
                        course.level === 'beginner' ? 'badge-success' :
                        course.level === 'intermediate' ? 'badge-warning' :
                        'badge-secondary'
                      }`}>
                        {course.level}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {completedLessons} of {totalLessons} lessons completed
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/student/learning/${course._id}`)}
                        className="btn btn-primary flex-1 text-sm"
                      >
                        {enrollment.completed ? 'Review' : 'Continue Learning'}
                      </button>
                      {enrollment.completed && enrollment.certificate && (
                        <button
                          onClick={() => router.push(`/student/certificates/${enrollment._id}`)}
                          className="btn btn-outline text-sm"
                          title="View Certificate"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
