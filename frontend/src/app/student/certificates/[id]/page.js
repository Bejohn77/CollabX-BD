'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Cookies from 'js-cookie';
import { courseAPI, studentAPI } from '@/services/api';

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams();
  const enrollmentId = params.id;
  
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    loadCertificate();
  }, [enrollmentId]);

  const loadCertificate = async () => {
    try {
      const [enrollmentsResponse, profileResponse] = await Promise.all([
        courseAPI.getMyEnrollments(),
        studentAPI.getProfile().catch(() => null)
      ]);
      
      const enrollments = enrollmentsResponse?.data || enrollmentsResponse?.enrollments || enrollmentsResponse || [];
      const currentEnrollment = enrollments.find(e => e._id === enrollmentId);
      
      console.log('Certificate page - Enrollment ID:', enrollmentId);
      console.log('Certificate page - Found enrollment:', currentEnrollment);
      console.log('Certificate page - Certificate issued:', currentEnrollment?.certificateIssued);
      console.log('Certificate page - Progress:', currentEnrollment?.progress);
      console.log('Certificate page - Status:', currentEnrollment?.status);
      
      if (!currentEnrollment) {
        console.error('Enrollment not found');
        router.push('/student/enrollments');
        return;
      }
      
      // Allow viewing if progress is 100% OR certificate is issued
      if (!currentEnrollment.certificateIssued && currentEnrollment.progress < 100) {
        console.error('Certificate not available - progress:', currentEnrollment.progress);
        router.push('/student/enrollments');
        return;
      }
      
      setEnrollment(currentEnrollment);
      setCourse(currentEnrollment.course);
      
      // Get student name: priority order
      // 1. From enrollment.student (if populated by backend)
      // 2. From profile API response
      // 3. From user cookie
      // 4. Fallback to email first part
      let studentName = '';
      
      if (currentEnrollment.student?.firstName && currentEnrollment.student?.lastName) {
        studentName = `${currentEnrollment.student.firstName} ${currentEnrollment.student.lastName}`.trim();
        console.log('Certificate - Using name from enrollment.student:', studentName);
      } else if (profileResponse) {
        const profileData = profileResponse?.data || profileResponse;
        if (profileData.firstName && profileData.lastName) {
          studentName = `${profileData.firstName} ${profileData.lastName}`.trim();
          console.log('Certificate - Using name from profile API:', studentName);
        }
      } else {
        const userData = Cookies.get('user');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.firstName && parsedUser.lastName) {
            studentName = `${parsedUser.firstName} ${parsedUser.lastName}`.trim();
            console.log('Certificate - Using name from user cookie:', studentName);
          } else {
            studentName = parsedUser.email?.split('@')[0] || 'Student';
            console.log('Certificate - Fallback to email:', studentName);
          }
        }
      }
      
      setUserName(studentName || 'Student');
      console.log('Certificate - Final userName set to:', studentName || 'Student');
    } catch (error) {
      console.error('Error loading certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Use browser's print to PDF functionality
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!enrollment || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Certificate not found</p>
          <button onClick={() => router.push('/student/enrollments')} className="btn btn-primary mt-4">
            Back to My Courses
          </button>
        </div>
      </div>
    );
  }

  const completionDate = new Date(enrollment.completedAt || enrollment.updatedAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate certificate ID if not present
  const certificateId = enrollment.certificateId || `CERT-${course._id}-${user._id}-${Date.now()}`.substring(0, 30);

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-0 {
            padding: 0 !important;
          }
          .print\\:max-w-full {
            max-width: 100% !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 print:bg-white">
        {/* Header - Hidden in print */}
        <header className="bg-white shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.push('/student/enrollments')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to My Courses
            </button>
            <div className="flex gap-3">
              <button onClick={handleDownload} className="btn btn-primary">
                📥 Download / Print PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Certificate */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-full">
        <div className="bg-white shadow-2xl print:shadow-none relative" style={{ minHeight: '600px' }}>
          {/* Certificate Design */}
          <div className="h-full p-12 print:p-16 flex flex-col justify-between border-8 border-double border-primary-600 relative">
            {/* Decorative corner elements */}
            <div className="absolute top-4 left-4 w-20 h-20 border-l-4 border-t-4 border-primary-300"></div>
            <div className="absolute top-4 right-4 w-20 h-20 border-r-4 border-t-4 border-primary-300"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 border-l-4 border-b-4 border-primary-300"></div>
            <div className="absolute bottom-4 right-4 w-20 h-20 border-r-4 border-b-4 border-primary-300"></div>

            {/* Header */}
            <div className="text-center mt-4">
              <div className="text-primary-600 mb-4">
                <svg className="w-24 h-24 mx-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-5xl font-serif font-bold text-gray-800 mb-2">
                Certificate of Completion
              </h1>
              <div className="w-40 h-1 bg-gradient-to-r from-primary-400 via-primary-600 to-primary-400 mx-auto mb-6"></div>
              <p className="text-sm text-gray-600 uppercase tracking-wider">CollabX BD Learning Platform</p>
            </div>

            {/* Body */}
            <div className="text-center flex-1 flex flex-col justify-center py-8">
              <p className="text-xl text-gray-700 mb-4 font-light">
                This is to certify that
              </p>
              <h2 className="text-5xl font-bold text-gray-900 mb-6 px-8">
                <span className="border-b-4 border-primary-500 pb-2 inline-block">
                  {userName}
                </span>
              </h2>
              <p className="text-xl text-gray-700 mb-4 font-light">
                has successfully completed the course
              </p>
              <h3 className="text-4xl font-bold text-primary-600 mb-6">
                "{course.title}"
              </h3>
              <p className="text-gray-600 mb-2">
                Completion Rate: <span className="font-bold text-green-600">{Math.round(enrollment.progress)}%</span>
              </p>
              <p className="text-gray-600">
                Topics Completed: <span className="font-bold">{enrollment.completedTopics?.length || 0}</span> out of <span className="font-bold">{course.topics?.length || 0}</span>
              </p>
            </div>

            {/* Footer */}
            <div className="grid grid-cols-3 gap-8 items-end mt-8">
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mx-auto" style={{ width: '180px' }}>
                  <p className="text-sm font-bold text-gray-800">Platform Admin</p>
                  <p className="text-xs text-gray-600">Authorized Signature</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-50 rounded-lg py-3 px-4 border border-primary-200">
                  <p className="text-xs text-gray-600 mb-1">Completion Date</p>
                  <p className="text-lg font-bold text-primary-700">{completionDate}</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="border-t-2 border-gray-400 pt-2 mx-auto" style={{ width: '180px' }}>
                  <p className="text-xs font-semibold text-gray-700">Certificate ID</p>
                  <p className="text-xs text-gray-600 font-mono break-all">{certificateId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Details - Hidden in print */}
        <div className="mt-8 card print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certificate Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Course:</span>
              <span className="ml-2 font-medium">{course.title}</span>
            </div>
            <div>
              <span className="text-gray-600">Category:</span>
              <span className="ml-2 font-medium">{course.category}</span>
            </div>
            <div>
              <span className="text-gray-600">Level:</span>
              <span className="ml-2 font-medium capitalize">{course.level}</span>
            </div>
            <div>
              <span className="text-gray-600">Completed Topics:</span>
              <span className="ml-2 font-medium">{enrollment.completedTopics?.length || 0} / {course.topics?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Completion Date:</span>
              <span className="ml-2 font-medium">{completionDate}</span>
            </div>
            <div>
              <span className="text-gray-600">Certificate ID:</span>
              <span className="ml-2 font-medium font-mono text-xs">{certificateId}</span>
            </div>
          </div>

          {course.skillsCovered && course.skillsCovered.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Skills Acquired:</h4>
              <div className="flex flex-wrap gap-2">
                {course.skillsCovered.map((skill, idx) => (
                  <span key={idx} className="badge badge-primary">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 card print:hidden bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">📥 How to save your certificate as PDF</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Click the "Download / Print PDF" button above</li>
                <li>In the print dialog, select <strong>"Save as PDF"</strong> or <strong>"Microsoft Print to PDF"</strong> as the printer/destination</li>
                <li>Click Save and choose a location on your computer</li>
                <li>Share it on LinkedIn, add to your resume, or include in your portfolio!</li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}
