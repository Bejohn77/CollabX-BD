# Student Employability Platform

## 🎯 Project Overview

A comprehensive full-stack platform connecting students with employers through intelligent job matching, skill development, and professional networking. Built with modern technologies and clean architecture principles.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Start MongoDB (make sure it's running)

# 3. Seed database with sample data
cd backend && npm run seed

# 4. Start backend server (Terminal 1)
cd backend && npm run dev

# 5. Start frontend server (Terminal 2)
cd frontend && npm run dev

# 6. Open http://localhost:3000
```

**Demo Credentials:**
- Student: `john.doe@university.edu` / `student123`
- Employer: `hr@techcorp.com` / `employer123`
- Admin: `admin@platform.com` / `admin123`

## 📚 Documentation

- **[Complete Setup Guide](SETUP_GUIDE.md)** - Detailed installation and configuration
- **[API Documentation](API_DOCUMENTATION.md)** - All endpoints and examples
- **[Features Guide](FEATURES.md)** - Complete feature breakdown
- **[Posts Feature Guide](POSTS_FEATURE_DOCUMENTATION.md)** - Community blogs & posts documentation

## 💻 Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- Bcrypt, Helmet, CORS
- Express Validator

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Axios
- JS-Cookie

## 📁 Project Structure

```
├── backend/               # Node.js API
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── middleware/   # Auth, validation, errors
│   │   ├── models/       # MongoDB schemas
│   │   ├── modules/      # Feature modules
│   │   └── utils/        # Helpers, seed data
│   └── package.json
│
├── frontend/             # Next.js UI
│   ├── src/
│   │   ├── app/         # Pages (Next.js 14)
│   │   ├── components/  # React components
│   │   └── services/    # API layer
│   └── package.json
│
└── Documentation files
```

## ✨ Key Features

### For Students
- ✅ Professional profile with skills, projects, education
- ✅ Smart job recommendations (AI-powered matching)
- ✅ One-click job applications
- ✅ Application tracking dashboard
- ✅ Skill-based course enrollment
- ✅ Certificate issuance
- ✅ Social networking (posts, likes, follows)
- ✅ Community blogs & posts (LinkedIn-style)
- ✅ Project portfolio showcase

### For Employers
- ✅ Company profile management
- ✅ Job posting with custom questions
- ✅ Candidate search and filtering
- ✅ Applicant tracking system
- ✅ Match score for applicants
- ✅ Project-based hiring challenges
- ✅ Verification badges
- ✅ Community engagement through posts

### For Admins
- ✅ Analytics dashboard
- ✅ User management
- ✅ Community posts moderation
- ✅ Job moderation and approval
- ✅ Course creation and management
- ✅ Content moderation
- ✅ Platform statistics

## 🎓 For Capstone Submission

### Code Quality
✅ Clean, modular architecture  
✅ Comprehensive comments  
✅ Best practices (MVC pattern)  
✅ Error handling throughout  
✅ Input validation  
✅ Security measures  

### Documentation
✅ README with setup instructions  
✅ API documentation  
✅ Feature documentation  
✅ Code comments  
✅ Sample data included  

### Functionality
✅ Complete authentication system  
✅ Role-based access control  
✅ Full CRUD operations  
✅ Database relationships  
✅ File uploads support  
✅ Search and filtering  
✅ Pagination  
✅ Recommendation algorithm  

### Deployment Ready
✅ Environment configuration  
✅ Production-ready structure  
✅ Scalable architecture  
✅ Security best practices  

## 🔐 Security Features

- JWT token-based authentication
- Password hashing (bcrypt with 10 rounds)
- Role-based access control (RBAC)
- Input validation and sanitization
- XSS prevention
- Rate limiting (100 req/15min)
- CORS configuration
- Helmet.js security headers

## 📊 Database Models

- **User** - Authentication and base user data
- **StudentProfile** - Complete student information
- **EmployerProfile** - Company information
- **Job** - Job postings
- **Application** - Job applications with tracking
- **Course** - Learning courses with modules
- **Enrollment** - Course enrollments with progress
- **Post** - Social feed posts
- **ProjectChallenge** - Hiring challenges

## 🛠️ Development

### Available Scripts

**Backend:**
```bash
npm run dev      # Start development server
npm start        # Start production server
npm run seed     # Seed database with sample data
npm test         # Run tests (when implemented)
```

**Frontend:**
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Connect MongoDB Atlas
3. Deploy from Git repository

### Frontend (Vercel/Netlify)
1. Connect Git repository
2. Set environment variables
3. Build command: `npm run build`
4. Deploy automatically

### Database (MongoDB Atlas)
1. Create free cluster
2. Whitelist IP addresses
3. Update `MONGODB_URI` in backend

## 📈 Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large datasets
- Efficient MongoDB queries
- Response compression
- Static file serving
- Connection pooling ready

## 🤝 Contributing

This is a capstone project. For production use:

1. Add comprehensive testing (Jest, Cypress)
2. Implement CI/CD pipeline
3. Add proper logging (Winston/Morgan)
4. Set up monitoring (PM2/New Relic)
5. Implement caching (Redis)
6. Add email notifications
7. Real-time features (Socket.io)

## 📝 License

MIT License - Educational/Capstone Project

## 👥 Credits

Built as a capstone project demonstrating full-stack development skills with modern technologies and best practices.

---

## 📞 Support

For issues:
1. Check [SETUP_GUIDE.md](SETUP_GUIDE.md)
2. Review error messages in console
3. Ensure MongoDB is running
4. Verify environment variables
5. Check API documentation

---

**Happy Coding! 🚀**
