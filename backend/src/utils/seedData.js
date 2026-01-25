require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const EmployerProfile = require('../models/EmployerProfile');
const Job = require('../models/Job');
const Course = require('../models/Course');

/**
 * Seed Database with Sample Data
 * For development and testing purposes
 */

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await StudentProfile.deleteMany({});
    await EmployerProfile.deleteMany({});
    await Job.deleteMany({});
    await Course.deleteMany({});
    
    console.log('✅ Existing data cleared');

    // Create Admin User
    console.log('👤 Creating admin user...');
    const admin = await User.create({
      email: 'admin@platform.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create Sample Students
    console.log('👨‍🎓 Creating sample students...');
    const students = [];
    
    const student1 = await User.create({
      email: 'john.doe@university.edu',
      password: 'student123',
      role: 'student',
      isVerified: true,
      isActive: true
    });
    
    await StudentProfile.create({
      user: student1._id,
      firstName: 'John',
      lastName: 'Doe',
      bio: 'Computer Science student passionate about web development and AI',
      university: {
        name: 'Tech University',
        email: 'john.doe@university.edu',
        verified: true,
        graduationYear: 2025
      },
      education: [{
        institution: 'Tech University',
        degree: "Bachelor's in Computer Science",
        fieldOfStudy: 'Computer Science',
        startDate: new Date('2021-09-01'),
        current: true,
        gpa: 3.8
      }],
      skills: [
        { name: 'JavaScript', proficiency: 'advanced' },
        { name: 'React', proficiency: 'advanced' },
        { name: 'Node.js', proficiency: 'intermediate' },
        { name: 'Python', proficiency: 'intermediate' },
        { name: 'MongoDB', proficiency: 'intermediate' }
      ],
      projects: [{
        title: 'E-commerce Platform',
        description: 'Full-stack e-commerce application with payment integration',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        startDate: new Date('2023-06-01'),
        endDate: new Date('2023-09-01'),
        githubUrl: 'https://github.com/johndoe/ecommerce',
        category: 'personal'
      }],
      jobPreferences: {
        jobTypes: ['full-time', 'internship'],
        desiredRoles: ['Full Stack Developer', 'Frontend Developer'],
        remotePreference: 'hybrid',
        expectedSalary: {
          min: 60000,
          max: 80000,
          currency: 'USD'
        }
      },
      socialLinks: {
        github: 'https://github.com/johndoe',
        linkedin: 'https://linkedin.com/in/johndoe'
      },
      isLookingForJob: true
    });
    
    students.push(student1);

    const student2 = await User.create({
      email: 'jane.smith@university.edu',
      password: 'student123',
      role: 'student',
      isVerified: true,
      isActive: true
    });
    
    await StudentProfile.create({
      user: student2._id,
      firstName: 'Jane',
      lastName: 'Smith',
      bio: 'Data Science enthusiast with strong analytical skills',
      university: {
        name: 'Data University',
        email: 'jane.smith@university.edu',
        verified: true,
        graduationYear: 2024
      },
      education: [{
        institution: 'Data University',
        degree: "Master's in Data Science",
        fieldOfStudy: 'Data Science',
        startDate: new Date('2022-09-01'),
        current: true,
        gpa: 3.9
      }],
      skills: [
        { name: 'Python', proficiency: 'expert' },
        { name: 'Machine Learning', proficiency: 'advanced' },
        { name: 'TensorFlow', proficiency: 'advanced' },
        { name: 'SQL', proficiency: 'advanced' },
        { name: 'Data Visualization', proficiency: 'intermediate' }
      ],
      jobPreferences: {
        jobTypes: ['full-time', 'contract'],
        desiredRoles: ['Data Scientist', 'ML Engineer'],
        remotePreference: 'remote'
      },
      isLookingForJob: true
    });
    
    students.push(student2);

    console.log('✅ Sample students created');

    // Create Sample Employers
    console.log('🏢 Creating sample employers...');
    const employers = [];
    
    const employer1 = await User.create({
      email: 'hr@techcorp.com',
      password: 'employer123',
      role: 'employer',
      isVerified: true,
      isActive: true
    });
    
    await EmployerProfile.create({
      user: employer1._id,
      companyName: 'TechCorp Solutions',
      companySize: '201-500',
      industry: 'Information Technology',
      foundedYear: 2010,
      description: 'Leading software development company specializing in enterprise solutions',
      website: 'https://techcorp.com',
      headquarters: {
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'California',
        country: 'USA'
      },
      contactPerson: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        designation: 'HR Manager',
        phone: '+1-555-0100'
      },
      isVerified: true,
      verifiedAt: new Date(),
      hiringFor: ['full-time', 'internship']
    });
    
    employers.push(employer1);

    const employer2 = await User.create({
      email: 'careers@dataanalytics.com',
      password: 'employer123',
      role: 'employer',
      isVerified: true,
      isActive: true
    });
    
    await EmployerProfile.create({
      user: employer2._id,
      companyName: 'DataAnalytics Inc',
      companySize: '51-200',
      industry: 'Data Analytics',
      foundedYear: 2015,
      description: 'Data-driven insights for business growth',
      website: 'https://dataanalytics.com',
      headquarters: {
        city: 'New York',
        state: 'New York',
        country: 'USA'
      },
      isVerified: true,
      verifiedAt: new Date(),
      hiringFor: ['full-time', 'contract']
    });
    
    employers.push(employer2);

    console.log('✅ Sample employers created');

    // Create Sample Jobs
    console.log('💼 Creating sample jobs...');
    
    await Job.create({
      employer: employer1._id,
      title: 'Full Stack Developer Intern',
      description: 'Join our team to work on exciting projects using modern web technologies. Perfect opportunity for students looking to gain real-world experience.',
      jobType: 'internship',
      workMode: 'hybrid',
      location: {
        city: 'San Francisco',
        state: 'California',
        country: 'USA',
        isRemote: false
      },
      experienceLevel: 'entry',
      minimumExperience: 0,
      education: ['bachelor'],
      requiredSkills: [
        { name: 'JavaScript', proficiency: 'intermediate' },
        { name: 'React', proficiency: 'beginner' },
        { name: 'Node.js', proficiency: 'beginner' }
      ],
      preferredSkills: ['MongoDB', 'Git', 'REST APIs'],
      salary: {
        min: 20,
        max: 30,
        currency: 'USD',
        period: 'hourly'
      },
      benefits: ['Mentorship', 'Learning opportunities', 'Flexible hours'],
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      numberOfOpenings: 3,
      status: 'active',
      isPublished: true,
      publishedAt: new Date(),
      approvedBy: admin._id,
      approvedAt: new Date()
    });

    await Job.create({
      employer: employer2._id,
      title: 'Junior Data Scientist',
      description: 'Looking for a passionate data scientist to join our analytics team. Work on machine learning models and data visualization projects.',
      jobType: 'full-time',
      workMode: 'remote',
      location: {
        city: 'New York',
        state: 'New York',
        country: 'USA',
        isRemote: true
      },
      experienceLevel: 'entry',
      minimumExperience: 1,
      education: ['bachelor', 'master'],
      requiredSkills: [
        { name: 'Python', proficiency: 'advanced' },
        { name: 'Machine Learning', proficiency: 'intermediate' },
        { name: 'SQL', proficiency: 'intermediate' }
      ],
      preferredSkills: ['TensorFlow', 'PyTorch', 'Pandas', 'NumPy'],
      salary: {
        min: 70000,
        max: 90000,
        currency: 'USD',
        period: 'yearly'
      },
      benefits: ['Health insurance', 'Remote work', '401k', 'Learning budget'],
      applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      numberOfOpenings: 2,
      status: 'active',
      isPublished: true,
      publishedAt: new Date(),
      approvedBy: admin._id,
      approvedAt: new Date()
    });

    await Job.create({
      employer: employer1._id,
      title: 'Frontend Developer',
      description: 'Experienced frontend developer needed to build modern, responsive web applications.',
      jobType: 'full-time',
      workMode: 'onsite',
      location: {
        city: 'San Francisco',
        state: 'California',
        country: 'USA'
      },
      experienceLevel: 'intermediate',
      minimumExperience: 2,
      requiredSkills: [
        { name: 'React', proficiency: 'advanced' },
        { name: 'JavaScript', proficiency: 'advanced' },
        { name: 'CSS', proficiency: 'advanced' }
      ],
      salary: {
        min: 80000,
        max: 110000,
        currency: 'USD',
        period: 'yearly'
      },
      status: 'active',
      isPublished: true,
      publishedAt: new Date(),
      approvedBy: admin._id,
      approvedAt: new Date()
    });

    console.log('✅ Sample jobs created');

    // Create Sample Courses
    console.log('📚 Creating sample courses...');
    
    await Course.create({
      title: 'Full Stack Web Development Bootcamp',
      slug: 'full-stack-web-development-bootcamp',
      description: 'Learn to build modern web applications from scratch using MERN stack',
      thumbnail: '/images/courses/fullstack.jpg',
      category: 'Web Development',
      level: 'beginner',
      skillsCovered: [
        { name: 'JavaScript', proficiencyGained: 'advanced' },
        { name: 'React', proficiencyGained: 'advanced' },
        { name: 'Node.js', proficiencyGained: 'intermediate' },
        { name: 'MongoDB', proficiencyGained: 'intermediate' }
      ],
      duration: {
        value: 12,
        unit: 'weeks'
      },
      estimatedTimeToComplete: 120,
      modules: [
        {
          title: 'Introduction to Web Development',
          description: 'Understanding the basics of web development',
          order: 1,
          lessons: [
            {
              title: 'HTML Basics',
              description: 'Learn the fundamentals of HTML',
              duration: 60,
              order: 1
            },
            {
              title: 'CSS Fundamentals',
              description: 'Styling web pages with CSS',
              duration: 90,
              order: 2
            }
          ]
        },
        {
          title: 'JavaScript Essentials',
          description: 'Master JavaScript programming',
          order: 2,
          lessons: [
            {
              title: 'JavaScript Basics',
              description: 'Variables, functions, and control flow',
              duration: 120,
              order: 1
            }
          ]
        }
      ],
      instructors: [
        {
          name: 'Dr. Emily Chen',
          bio: 'Senior Software Engineer with 10+ years experience',
          credentials: 'PhD in Computer Science'
        }
      ],
      certificateAwarded: true,
      isFree: true,
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin._id
    });

    await Course.create({
      title: 'Machine Learning Fundamentals',
      slug: 'machine-learning-fundamentals',
      description: 'Introduction to machine learning concepts and algorithms',
      category: 'Data Science',
      level: 'intermediate',
      skillsCovered: [
        { name: 'Python', proficiencyGained: 'advanced' },
        { name: 'Machine Learning', proficiencyGained: 'intermediate' },
        { name: 'TensorFlow', proficiencyGained: 'beginner' }
      ],
      duration: {
        value: 8,
        unit: 'weeks'
      },
      estimatedTimeToComplete: 80,
      modules: [
        {
          title: 'Introduction to ML',
          description: 'What is machine learning?',
          order: 1,
          lessons: [
            {
              title: 'ML Overview',
              description: 'Understanding machine learning basics',
              duration: 45,
              order: 1
            }
          ]
        }
      ],
      certificateAwarded: true,
      isFree: true,
      isPublished: true,
      publishedAt: new Date(),
      createdBy: admin._id
    });

    console.log('✅ Sample courses created');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('═══════════════════════════════════════════');
    console.log('📝 Sample Login Credentials:');
    console.log('═══════════════════════════════════════════');
    console.log('\n👤 Admin:');
    console.log('   Email: admin@platform.com');
    console.log('   Password: admin123');
    console.log('\n👨‍🎓 Student:');
    console.log('   Email: john.doe@university.edu');
    console.log('   Password: student123');
    console.log('\n🏢 Employer:');
    console.log('   Email: hr@techcorp.com');
    console.log('   Password: employer123');
    console.log('\n═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

const runSeed = async () => {
  try {
    await connectDB();
    await seedData();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

runSeed();
