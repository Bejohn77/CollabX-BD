# API Endpoints Documentation

## Base URL
```
http://localhost:5000/api
```

All requests except authentication endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication

### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123",
  "role": "student",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "_id": "user-id",
    "email": "student@university.edu",
    "role": "student"
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "student@university.edu",
  "password": "password123"
}
```

### Get Current User
```http
GET /api/auth/me
```
*Requires authentication*

---

## 👨‍🎓 Students

### Get Student Profile
```http
GET /api/students/profile
```
*Requires authentication (Student role)*

### Update Student Profile
```http
PUT /api/students/profile
```

**Request Body:**
```json
{
  "bio": "Passionate developer",
  "skills": [
    {
      "name": "JavaScript",
      "proficiency": "advanced"
    }
  ],
  "jobPreferences": {
    "jobTypes": ["full-time", "internship"],
    "remotePreference": "hybrid"
  }
}
```

### Create Post
```http
POST /api/students/posts
```

**Request Body:**
```json
{
  "content": "Just completed my first web app!",
  "postType": "project-showcase",
  "visibility": "public"
}
```

### Get Feed
```http
GET /api/students/feed?page=1&limit=10
```

### Follow User
```http
POST /api/students/follow/:userId
```

---

## 💼 Jobs

### Get All Jobs
```http
GET /api/jobs?page=1&limit=10&jobType=internship&skills=JavaScript,React
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `jobType` - Filter by job type (full-time, part-time, internship, etc.)
- `workMode` - Filter by work mode (remote, onsite, hybrid)
- `skills` - Comma-separated skill names
- `location` - City name
- `search` - Text search in title and description

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "job-id",
      "title": "Full Stack Developer Intern",
      "description": "...",
      "jobType": "internship",
      "requiredSkills": [
        {
          "name": "JavaScript",
          "proficiency": "intermediate"
        }
      ],
      "salary": {
        "min": 20,
        "max": 30,
        "currency": "USD",
        "period": "hourly"
      },
      "employer": {
        "companyName": "TechCorp"
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "perPage": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Get Job Details
```http
GET /api/jobs/:id
```

### Apply to Job
```http
POST /api/jobs/:id/apply
```

**Request Body:**
```json
{
  "coverLetter": "I am very interested in this position...",
  "customAnswers": [
    {
      "question": "Why do you want to work here?",
      "answer": "Because..."
    }
  ]
}
```

### Get My Applications
```http
GET /api/jobs/applications/my?status=pending
```

### Get Job Recommendations
```http
GET /api/jobs/recommendations?page=1&limit=10
```
*Returns personalized job recommendations based on student profile*

---

## 🏢 Employers

### Get Employer Profile
```http
GET /api/employers/profile
```
*Requires authentication (Employer role)*

### Create Job Posting
```http
POST /api/employers/jobs
```

**Request Body:**
```json
{
  "title": "Frontend Developer",
  "description": "We are looking for...",
  "jobType": "full-time",
  "workMode": "hybrid",
  "location": {
    "city": "San Francisco",
    "state": "California",
    "country": "USA"
  },
  "requiredSkills": [
    {
      "name": "React",
      "proficiency": "advanced"
    }
  ],
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD",
    "period": "yearly"
  },
  "numberOfOpenings": 2,
  "applicationDeadline": "2026-03-31"
}
```

### Get My Jobs
```http
GET /api/employers/jobs?status=active
```

### Get Job Applicants
```http
GET /api/employers/jobs/:jobId/applicants?status=pending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "application-id",
      "student": {
        "email": "student@university.edu",
        "studentProfile": {
          "firstName": "John",
          "lastName": "Doe",
          "skills": [...],
          "profileCompleteness": 85
        }
      },
      "status": "pending",
      "matchScore": 78,
      "createdAt": "2026-01-15T10:30:00.000Z"
    }
  ]
}
```

### Update Application Status
```http
PUT /api/employers/applications/:applicationId/status
```

**Request Body:**
```json
{
  "status": "shortlisted",
  "notes": "Great candidate, schedule interview"
}
```

### Search Candidates
```http
GET /api/employers/search-candidates?skills=React,Node.js&location=San Francisco
```

---

## 📚 Courses

### Get All Courses
```http
GET /api/courses?category=Web Development&level=beginner
```

### Get Course Details
```http
GET /api/courses/:id
```

### Enroll in Course
```http
POST /api/courses/:id/enroll
```

### Get My Enrollments
```http
GET /api/courses/my/enrollments?status=active
```

### Complete Lesson
```http
PUT /api/courses/:courseId/lessons/:lessonId/complete
```

**Request Body:**
```json
{
  "moduleId": "module-id"
}
```

### Submit Assessment
```http
POST /api/courses/:courseId/assessments/:assessmentId/submit
```

**Request Body:**
```json
{
  "answers": ["option1", "option2", "answer3"]
}
```

### Complete Course
```http
POST /api/courses/:id/complete
```

### Rate Course
```http
POST /api/courses/:id/rate
```

**Request Body:**
```json
{
  "rating": 5,
  "review": "Excellent course!"
}
```

### Get Courses for Job
```http
GET /api/courses/recommendations/for-job/:jobId
```
*Returns courses that teach skills required for a specific job*

---

## 👑 Admin

### Get Dashboard Statistics
```http
GET /api/admin/dashboard
```
*Requires authentication (Admin role)*

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1500,
      "totalStudents": 1200,
      "totalEmployers": 50,
      "totalJobs": 200,
      "activeJobs": 150
    },
    "recentActivity": {
      "newUsersLast30Days": 150,
      "newJobsLast30Days": 25
    },
    "topSkills": [
      { "_id": "JavaScript", "count": 85 },
      { "_id": "Python", "count": 72 }
    ]
  }
}
```

### Get All Users
```http
GET /api/admin/users?role=student&isActive=true
```

### Approve Job
```http
PUT /api/admin/jobs/:id/approve
```

### Reject Job
```http
PUT /api/admin/jobs/:id/reject
```

**Request Body:**
```json
{
  "reason": "Job description does not meet guidelines"
}
```

### Create Course
```http
POST /api/admin/courses
```

### Verify Employer
```http
PUT /api/admin/employers/:userId/verify
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "perPage": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 📝 Posts & Community Blogs

### Get Feed
```http
GET /api/posts/feed
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `postType` - Filter by type: `general`, `job-achievement`, `course-completion`, `project-showcase`, `article-share`
- `search` - Text search in content

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "post-id",
      "author": {
        "_id": "user-id",
        "email": "user@example.com",
        "studentProfile": {
          "firstName": "John",
          "lastName": "Doe",
          "profilePhoto": "url"
        }
      },
      "content": "Post content here...",
      "postType": "general",
      "visibility": "public",
      "likes": [],
      "comments": [],
      "views": 42,
      "createdAt": "2026-01-22T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "hasNext": true
  }
}
```

### Get Single Post
```http
GET /api/posts/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "post-id",
    "author": { /* populated author */ },
    "content": "Post content",
    "postType": "general",
    "visibility": "public",
    "likes": [{ "user": "user-id", "likedAt": "2026-01-22T10:00:00Z" }],
    "comments": [
      {
        "_id": "comment-id",
        "user": { /* populated user */ },
        "content": "Great post!",
        "createdAt": "2026-01-22T10:05:00Z"
      }
    ],
    "views": 42,
    "isReported": false,
    "isHidden": false,
    "createdAt": "2026-01-22T10:00:00Z"
  }
}
```

### Create Post
```http
POST /api/posts
```

**Request Body:**
```json
{
  "content": "Your post content here (max 5000 chars)",
  "postType": "general",
  "visibility": "public",
  "media": [],
  "relatedJob": "job-id",
  "relatedCourse": "course-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* created post */ },
  "message": "Post created successfully"
}
```

### Update Post
```http
PUT /api/posts/:id
```

**Request Body:**
```json
{
  "content": "Updated content",
  "postType": "project-showcase",
  "visibility": "connections"
}
```

### Delete Post
```http
DELETE /api/posts/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Post deleted successfully"
}
```

### Like/Unlike Post
```http
POST /api/posts/:id/like
```

**Response:**
```json
{
  "success": true,
  "data": {
    "likesCount": 15,
    "isLiked": true
  },
  "message": "Post liked"
}
```

### Add Comment
```http
POST /api/posts/:id/comment
```

**Request Body:**
```json
{
  "content": "Your comment here (max 1000 chars)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "comment-id",
    "user": { /* populated user */ },
    "content": "Your comment",
    "createdAt": "2026-01-22T10:00:00Z"
  },
  "message": "Comment added successfully"
}
```

### Delete Comment
```http
DELETE /api/posts/:id/comment/:commentId
```

### Report Post
```http
POST /api/posts/:id/report
```

**Request Body:**
```json
{
  "reason": "Inappropriate content"
}
```

### Get User's Posts
```http
GET /api/posts/user/:userId
```

### Get My Posts
```http
GET /api/posts/my/posts
```

**Query Parameters:**
- `page` - Page number
- `limit` - Items per page

---

## 🔍 Common Query Parameters

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (prefix with `-` for descending, e.g., `-createdAt`)
- `search` - Text search
- `status` - Filter by status
- `category` - Filter by category

---

## ⚠️ Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🔐 Authentication Flow

1. Register or login to receive JWT token
2. Store token securely (localStorage, cookies, etc.)
3. Include token in all subsequent requests:
   ```
   Authorization: Bearer <token>
   ```
4. Token expires in 7 days by default
5. Logout removes token from client side

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Dates should be sent in ISO 8601 format
- File uploads use multipart/form-data
- Maximum request body size: 10MB
- Rate limiting: 100 requests per 15 minutes per IP
- Post content: 1-5000 characters
- Comment content: 1-1000 characters
- Post types: `general`, `job-achievement`, `course-completion`, `project-showcase`, `article-share`
- Visibility options: `public`, `connections`, `private`
