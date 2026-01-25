'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { courseAPI, studentAPI } from '@/services/api';

export default function CourseLearningPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;
  
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [completingTopic, setCompletingTopic] = useState(false);

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

    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      // Load course details and profile
      const [courseResponse, profileResponse] = await Promise.all([
        courseAPI.getCourse(courseId),
        studentAPI.getProfile().catch(() => null)
      ]);
      
      // Update user with profile name if available
      if (profileResponse) {
        const profileData = profileResponse?.data || profileResponse;
        setProfile(profileData);
        if (profileData.firstName && profileData.lastName) {
          setUser(prev => ({
            ...prev,
            firstName: profileData.firstName,
            lastName: profileData.lastName
          }));
        }
      }
      
      console.log('=== COURSE LOADING DEBUG ===');
      console.log('1. Full Response:', JSON.stringify(courseResponse, null, 2));
      console.log('2. Response keys:', Object.keys(courseResponse || {}));
      
      // Try multiple ways to extract course data
      let courseData = null;
      
      if (courseResponse?.data?.course) {
        console.log('3. Found course in response.data.course');
        courseData = courseResponse.data.course;
      } else if (courseResponse?.course) {
        console.log('3. Found course in response.course');
        courseData = courseResponse.course;
      } else if (courseResponse?.data) {
        console.log('3. Found course in response.data');
        courseData = courseResponse.data;
      } else {
        console.log('3. Using response directly');
        courseData = courseResponse;
      }
      
      console.log('4. Final courseData:', courseData);
      console.log('5. Topics array:', courseData?.topics);
      console.log('6. Topics count:', courseData?.topics?.length);
      console.log('7. First topic:', courseData?.topics?.[0]);
      
      if (!courseData || !courseData.topics || courseData.topics.length === 0) {
        console.error('ERROR: No topics found!');
        console.log('Course data structure:', JSON.stringify(courseData, null, 2));
      }
      
      setCourse(courseData);

      // Load enrollment status
      const enrollmentsResponse = await courseAPI.getMyEnrollments();
      const enrollmentsData = enrollmentsResponse?.data || enrollmentsResponse?.enrollments || enrollmentsResponse || [];
      const currentEnrollment = enrollmentsData.find(e => e.course._id === courseId);
      
      if (!currentEnrollment) {
        router.push(`/courses/${courseId}`);
        return;
      }
      
      setEnrollment(currentEnrollment);
      
      // Set current topic to last viewed or first incomplete
      if (currentEnrollment.lastTopicViewed) {
        const lastIndex = courseData.topics?.findIndex(t => t._id === currentEnrollment.lastTopicViewed);
        if (lastIndex !== -1) {
          setCurrentTopicIndex(lastIndex);
        }
      }
    } catch (error) {
      console.error('Error loading course data:', error);
      setMessage({ type: 'error', text: 'Failed to load course data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTopic = async () => {
    if (!course?.topics?.[currentTopicIndex]) return;
    
    const topic = course.topics[currentTopicIndex];
    setCompletingTopic(true);
    
    try {
      await courseAPI.completeTopic(courseId, topic._id);
      setMessage({ type: 'success', text: 'Topic completed! 🎉' });
      
      // Reload enrollment data to update progress
      await loadCourseData();

      // Auto-advance to next topic after 1.5 seconds
      setTimeout(() => {
        if (currentTopicIndex < course.topics.length - 1) {
          setCurrentTopicIndex(currentTopicIndex + 1);
          setMessage({ type: '', text: '' });
        }
      }, 1500);
    } catch (error) {
      console.error('Error completing topic:', error);
      setMessage({ type: 'error', text: 'Failed to mark topic as complete' });
    } finally {
      setCompletingTopic(false);
    }
  };

  const isTopicCompleted = (topicId) => {
    return enrollment?.completedTopics?.some(ct => ct === topicId || ct._id === topicId);
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

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course not found</h2>
          <button onClick={() => router.push('/student/enrollments')} className="btn btn-primary">
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const currentTopic = course.topics?.[currentTopicIndex];
  const totalTopics = course.topics?.length || 0;
  const completedCount = enrollment.completedTopics?.length || 0;

  console.log('Rendering - course:', course);
  console.log('Rendering - currentTopic:', currentTopic);
  console.log('Rendering - totalTopics:', totalTopics);
  console.log('Rendering - topics array:', course?.topics);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/student/enrollments')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{course.title}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{completedCount} / {totalTopics} topics completed</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${enrollment.progress || 0}%` }}
                    />
                  </div>
                  <span className="font-semibold">{Math.round(enrollment.progress || 0)}%</span>
                </div>
              </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Topics List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">📚 Course Topics</h2>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {course.topics?.map((topic, index) => (
                  <button
                    key={topic._id}
                    onClick={() => setCurrentTopicIndex(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentTopicIndex === index
                        ? 'bg-primary-50 border-primary-300 text-primary-900'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isTopicCompleted(topic._id)
                          ? 'bg-green-500 text-white'
                          : currentTopicIndex === index
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {isTopicCompleted(topic._id) ? '✓' : index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          currentTopicIndex === index ? 'text-primary-900' : 'text-gray-900'
                        }`}>
                          {topic.title}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6 lg:p-8">
              {currentTopic ? (
                <>
                  {/* Topic Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <span>Topic {currentTopicIndex + 1} of {totalTopics}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{currentTopic.title}</h1>
                    {isTopicCompleted(currentTopic._id) && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Completed
                      </div>
                    )}
                  </div>

                  {/* Topic Content */}
                  <div className="prose max-w-none mb-8">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {currentTopic.content}
                    </div>
                  </div>

                  {/* Code Examples */}
                  {currentTopic.codeExamples && currentTopic.codeExamples.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">💻 Code Examples</h2>
                      {currentTopic.codeExamples.map((example, idx) => (
                        <div key={idx} className="mb-6">
                          {example.title && (
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{example.title}</h3>
                          )}
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-400">{example.language || 'code'}</span>
                            </div>
                            <pre className="text-sm text-gray-100"><code>{example.code}</code></pre>
                          </div>
                          {example.output && (
                            <div className="mt-2 bg-gray-100 rounded-lg p-3">
                              <p className="text-xs text-gray-600 mb-1">Output:</p>
                              <pre className="text-sm text-gray-800"><code>{example.output}</code></pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center pt-6 border-t">
                    <button
                      onClick={() => currentTopicIndex > 0 && setCurrentTopicIndex(currentTopicIndex - 1)}
                      disabled={currentTopicIndex === 0}
                      className="btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous Topic
                    </button>

                    <div className="flex gap-3">
                      {!isTopicCompleted(currentTopic._id) && (
                        <button
                          onClick={handleCompleteTopic}
                          disabled={completingTopic}
                          className="btn btn-primary"
                        >
                          {completingTopic ? 'Completing...' : '✓ Mark as Complete'}
                        </button>
                      )}
                      
                      {currentTopicIndex < totalTopics - 1 ? (
                        <button
                          onClick={() => setCurrentTopicIndex(currentTopicIndex + 1)}
                          className="btn btn-primary"
                        >
                          Next Topic →
                        </button>
                      ) : (
                        enrollment.progress === 100 && (
                          <button
                            onClick={() => router.push(`/student/certificates/${enrollment._id}`)}
                            className="btn btn-success"
                          >
                            🎓 View Certificate
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">No topics available for this course yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
