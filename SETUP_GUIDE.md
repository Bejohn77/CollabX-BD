# Student Employability Platform - Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v6 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

## 🚀 Quick Start

### 1. Clone the Repository (if using Git)

```bash
git clone <repository-url>
cd student-employability-platform
```

Or simply navigate to the project directory if you already have the code.

### 2. Install Dependencies

#### Backend Setup

```bash
cd backend
npm install
```

#### Frontend Setup

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

#### Backend Configuration

1. Navigate to the backend directory
2. Copy the example environment file:

```bash
cd backend
copy .env.example .env
```

3. Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/employability_platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

**Important:** Change `JWT_SECRET` to a strong, random string in production!

#### Frontend Configuration

1. Navigate to the frontend directory
2. Copy the example environment file:

```bash
cd frontend
copy .env.example .env.local
```

3. Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Student Employability Platform
```

### 4. Start MongoDB

Make sure MongoDB is running on your system:

**Windows:**
```bash
# MongoDB should start automatically if installed as a service
# Or manually start it:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath="C:\data\db"
```

**Mac/Linux:**
```bash
mongod
# Or if installed via Homebrew (Mac):
brew services start mongodb-community
```

### 5. Seed the Database (Optional but Recommended)

This creates sample data for testing:

```bash
cd backend
npm run seed
```

**Sample Login Credentials After Seeding:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@platform.com | admin123 |
| Student | john.doe@university.edu | student123 |
| Employer | hr@techcorp.com | employer123 |

### 6. Start the Development Servers

#### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

Backend will run on: http://localhost:5000

#### Terminal 2 - Frontend Server

```bash
cd frontend
npm run dev
```

Frontend will run on: http://localhost:3000

### 7. Access the Application

Open your browser and navigate to:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/health

## 🎯 Testing the Platform

### As a Student:

1. Go to http://localhost:3000
2. Click "Sign Up" and create a student account
   - Or use demo credentials: `john.doe@university.edu` / `student123`
3. Complete your profile
4. Browse jobs and courses
5. Apply to jobs
6. Enroll in courses
7. Create posts and network

### As an Employer:

1. Go to http://localhost:3000
2. Create an employer account
   - Or use demo credentials: `hr@techcorp.com` / `employer123`
3. Complete company profile
4. Post job openings
5. Search for candidates
6. Review applications

### As an Admin:

1. Use credentials: `admin@platform.com` / `admin123`
2. Access admin dashboard
3. Manage users, jobs, and courses
4. View analytics
5. Moderate content

## 📁 Project Structure

```
student-employability-platform/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── models/            # MongoDB schemas
│   │   ├── modules/           # Feature modules (auth, students, employers, etc.)
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Main server file
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Next.js + React UI
│   ├── src/
│   │   ├── app/               # Next.js 14 app directory
│   │   ├── components/        # Reusable React components
│   │   ├── services/          # API service layer
│   │   └── utils/             # Frontend utilities
│   ├── package.json
│   └── .env.example
│
└── README.md                   # Main documentation
```

## 🔧 Troubleshooting

### MongoDB Connection Issues

**Error:** `MongooseError: connect ECONNREFUSED`

**Solution:**
1. Ensure MongoDB is running
2. Check if the connection string in `.env` is correct
3. Try: `mongodb://localhost:27017/employability_platform`

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
1. Change the port in backend `.env` file
2. Update frontend `.env.local` with new API URL
3. Or kill the process using the port:

**Windows:**
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:5000 | xargs kill -9
```

### Module Not Found Errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors

**Solution:**
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that CORS is properly configured in `server.js`

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Student Endpoints

- `GET /api/students/profile` - Get student profile
- `PUT /api/students/profile` - Update profile
- `POST /api/students/posts` - Create post
- `GET /api/students/feed` - Get social feed

### Job Endpoints

- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/apply` - Apply to job
- `GET /api/jobs/recommendations` - Get personalized recommendations

### Employer Endpoints

- `POST /api/employers/jobs` - Create job posting
- `GET /api/employers/jobs/:id/applicants` - View applicants
- `PUT /api/employers/applications/:id/status` - Update application status

### Course Endpoints

- `GET /api/courses` - List all courses
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/complete` - Complete course

## 🎨 Customization

### Changing Brand Colors

Edit `frontend/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Change these hex values
        600: '#your-color'
      }
    }
  }
}
```

### Adding New Features

1. **Backend:** Create a new module in `backend/src/modules/`
2. **Frontend:** Create components in `frontend/src/components/`
3. **Database:** Add models in `backend/src/models/`

## 🚀 Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)

1. Set environment variables in your hosting platform
2. Ensure MongoDB is accessible (use MongoDB Atlas for cloud database)
3. Build and deploy:

```bash
cd backend
npm start
```

### Frontend Deployment (e.g., Vercel, Netlify)

1. Connect your Git repository
2. Set environment variables
3. Build command: `npm run build`
4. Output directory: `.next`

### Database (MongoDB Atlas)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in backend `.env`

## 📝 Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Express.js Guide:** https://expressjs.com/
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Tailwind CSS:** https://tailwindcss.com/docs

## 🤝 Support

For issues or questions:

1. Check this documentation
2. Review the code comments
3. Check console logs for errors
4. Ensure all dependencies are installed

## 📄 License

This project is created as a capstone project for educational purposes.

---

**Happy Coding! 🎉**
