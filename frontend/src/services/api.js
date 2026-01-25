import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response || error);
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      Cookies.remove('token');
      Cookies.remove('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data)
};

// Student API
export const studentAPI = {
  getProfile: () => api.get('/students/profile'),
  updateProfile: (data) => {
    // If data is FormData, let browser set Content-Type with boundary
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put('/students/profile', data, config);
  },
  getPublicProfile: (id) => api.get(`/students/${id}`),
  followUser: (userId) => api.post(`/students/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/students/unfollow/${userId}`),
  createPost: (data) => api.post('/students/posts', data),
  getFeed: (page = 1, limit = 10) => api.get(`/students/feed?page=${page}&limit=${limit}`),
  likePost: (postId) => api.post(`/students/posts/${postId}/like`),
  commentOnPost: (postId, content) => api.post(`/students/posts/${postId}/comment`, { content }),
  endorseSkill: (skillName, userId) => api.post(`/students/skills/${skillName}/endorse`, { userId })
};

// Job API
export const jobAPI = {
  getJobs: (params) => api.get('/jobs', { params }),
  getAllJobs: (params) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  getJobById: (id) => api.get(`/jobs/${id}`),
  applyToJob: (id, data) => api.post(`/jobs/${id}/apply`, data),
  getMyApplications: (params) => api.get('/jobs/applications/my', { params }),
  withdrawApplication: (id, reason) => api.put(`/jobs/applications/${id}/withdraw`, { reason }),
  getRecommendations: (page = 1, limit = 10) => api.get(`/jobs/recommendations?page=${page}&limit=${limit}`)
};

// Application API
export const applicationAPI = {
  applyForJob: (jobId, data) => api.post(`/jobs/${jobId}/apply`, data),
  getMyApplications: (params) => api.get('/jobs/applications/my', { params }),
  withdrawApplication: (id, reason) => api.put(`/jobs/applications/${id}/withdraw`, { reason })
};

// Employer API
export const employerAPI = {
  getProfile: () => api.get('/employers/profile'),
  updateProfile: (data) => {
    // If data is FormData, let browser set Content-Type with boundary
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put('/employers/profile', data, config);
  },
  createJob: (data) => api.post('/employers/jobs', data),
  getMyJobs: (params) => api.get('/employers/jobs', { params }),
  updateJob: (id, data) => api.put(`/employers/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/employers/jobs/${id}`),
  getApplicants: (jobId, params) => api.get(`/employers/jobs/${jobId}/applicants`, { params }),
  updateApplicationStatus: (id, data) => api.put(`/employers/applications/${id}/status`, data),
  searchCandidates: (params) => api.get('/employers/search-candidates', { params }),
  createChallenge: (data) => api.post('/employers/challenges', data),
  getMyChallenges: () => api.get('/employers/challenges'),
  getChallengeSubmissions: (id) => api.get(`/employers/challenges/${id}/submissions`),
  evaluateSubmission: (challengeId, submissionId, data) => 
    api.put(`/employers/challenges/${challengeId}/submissions/${submissionId}`, data)
};

// Course API
export const courseAPI = {
  getCourses: (params) => api.get('/courses', { params }),
  getCourse: (id) => api.get(`/courses/${id}`),
  enrollInCourse: (id) => api.post(`/courses/${id}/enroll`),
  getMyEnrollments: (params) => api.get('/courses/my/enrollments', { params }),
  completeTopic: (courseId, topicId) => 
    api.put(`/courses/${courseId}/topics/${topicId}/complete`),
  completeLesson: (courseId, lessonId, moduleId) => 
    api.put(`/courses/${courseId}/lessons/${lessonId}/complete`, { moduleId }),
  submitAssessment: (courseId, assessmentId, answers) => 
    api.post(`/courses/${courseId}/assessments/${assessmentId}/submit`, { answers }),
  completeCourse: (id) => api.post(`/courses/${id}/complete`),
  rateCourse: (id, rating, review) => api.post(`/courses/${id}/rate`, { rating, review }),
  getCoursesForJob: (jobId) => api.get(`/courses/recommendations/for-job/${jobId}`)
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getJobs: (params) => api.get('/admin/jobs', { params }),
  approveJob: (id) => api.put(`/admin/jobs/${id}/approve`),
  rejectJob: (id, reason) => api.put(`/admin/jobs/${id}/reject`, { reason }),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  createCourse: (data) => api.post('/admin/courses', data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getReportedPosts: () => api.get('/admin/posts/reported'),
  togglePostVisibility: (id) => api.put(`/admin/posts/${id}/hide`),
  verifyEmployer: (id) => api.put(`/admin/employers/${id}/verify`),
  unverifyEmployer: (id) => api.put(`/admin/employers/${id}/unverify`)
};

export default api;
