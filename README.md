# Student Employability Platform

A comprehensive hybrid platform connecting students with employers through intelligent job matching, skill learning, and professional networking.

## 🎯 Features

### For Students
- Professional LinkedIn-style profiles
- Job search & application tracking
- Skill-based learning courses
- Project showcase & portfolio
- Social networking (posts, likes, follows)
- Resume builder
- Intelligent job recommendations

### For Employers
- Job posting & management
- Candidate search & filtering
- Project-based hiring challenges
- Applicant tracking system
- Messaging with candidates

### For Admins
- User management
- Job moderation
- Analytics dashboard
- Course management

## 🏗️ Architecture

```
student-employability-platform/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── modules/  # Feature modules
│   │   ├── models/   # MongoDB schemas
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
│
└── frontend/         # Next.js + Tailwind UI
    ├── src/
    │   ├── app/      # Next.js 14 app directory
    │   ├── components/
    │   ├── services/
    │   └── utils/
    └── package.json
```

## 🚀 Technology Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt password hashing
- Multer file uploads

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Axios for API calls
- React Query for data fetching

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

## 🔑 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/employability_platform
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📡 API Documentation

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/verify-email` - Verify university email

### Students
- GET/PUT `/api/students/profile` - Student profile
- POST `/api/students/posts` - Create post
- POST `/api/students/apply/:jobId` - Apply to job

### Employers
- POST `/api/employers/jobs` - Create job posting
- GET `/api/employers/applicants/:jobId` - View applicants
- POST `/api/employers/challenges` - Create hiring challenge

### Jobs
- GET `/api/jobs` - List all jobs
- GET `/api/jobs/:id` - Get job details
- GET `/api/jobs/recommendations` - Get personalized recommendations

### Courses
- GET `/api/courses` - List all courses
- POST `/api/courses/enroll/:courseId` - Enroll in course
- POST `/api/courses/:courseId/complete` - Mark course complete

### Admin
- GET `/api/admin/users` - List all users
- GET `/api/admin/analytics` - Platform analytics
- PUT `/api/admin/jobs/:id/approve` - Approve job posting

## 🧪 Seed Data

Run seed data for development:

```bash
cd backend
npm run seed
```

This creates sample students, employers, jobs, and courses.

## 🎨 Design Principles

1. **Modular Architecture** - Each feature is a self-contained module
2. **Clean Code** - Following SOLID principles and best practices
3. **Scalability** - Database indexing, pagination, caching-ready
4. **Security** - JWT auth, input validation, XSS prevention
5. **Responsive Design** - Mobile-first UI with Tailwind

## 📊 Database Schema

### Users
- Common fields: email, password, role (student/employer/admin)
- Role-specific profiles linked via references

### Jobs
- Title, description, skills required, salary, location
- Posted by employer, status (active/closed)

### Applications
- Student, job, status (pending/reviewed/accepted/rejected)
- Resume, cover letter, application date

### Courses
- Title, description, skills covered, duration
- Enrollments tracking progress and completion

### Posts (Social Feed)
- Content, author, likes, comments
- Follow relationships

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Rate limiting on sensitive endpoints
- CORS configuration
- Helmet.js security headers

## 🎯 Recommendation Algorithm

The platform uses a hybrid recommendation approach:

1. **Skill Matching** - Match job requirements with student skills
2. **Learning Path** - Consider completed courses
3. **Experience** - Factor in projects and prior work
4. **Interests** - Include student preferences
5. **Location** - Geographic proximity

Algorithm structure is ML-ready for future enhancements with cosine similarity or collaborative filtering.

## 📈 Future Enhancements

- Real-time messaging with Socket.io
- Video interviews integration
- AI-powered resume parsing
- Advanced ML recommendation models
- Mobile app (React Native)
- Payment integration for premium features
- Email notifications
- Calendar integration for interviews

## 🤝 Contributing

This is a capstone project. For production deployment:

1. Use environment-specific configs
2. Set up CI/CD pipeline
3. Implement proper logging (Winston/Morgan)
4. Add comprehensive testing (Jest/Cypress)
5. Set up monitoring (PM2/New Relic)
6. Configure CDN for assets
7. Implement Redis caching

## 📝 License

MIT License - Educational/Capstone Project

## 👥 Authors

Capstone Project - Student Employability Platform

---

**Note:** This is production-ready code structure designed for scalability and maintainability. All sensitive credentials should be stored in environment variables and never committed to version control.
