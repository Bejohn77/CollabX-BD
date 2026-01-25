import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                CollabX BD
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                Login
              </Link>
              <Link href="/auth/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold mb-6">
              Launch Your Career Journey
            </h1>
            <p className="text-xl mb-8 text-primary-100 max-w-3xl mx-auto">
              Connect with top employers, learn in-demand skills, and build your professional network. 
              Your path to success starts here.
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/auth/register?role=student" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
                I'm a Student
              </Link>
              <Link href="/auth/register?role=employer" className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-3">
                I'm an Employer
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center mb-12">Platform Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Job Matching */}
            <div className="card text-center hover:shadow-xl transition-shadow bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-3">Smart Job Matching</h3>
              <p className="text-gray-600 dark:text-gray-300">
                AI-powered job recommendations based on your skills, experience, and career goals.
              </p>
            </div>

            {/* Skill Learning */}
            <div className="card text-center hover:shadow-xl transition-shadow bg-gradient-to-br from-secondary-50 to-accent-50 dark:from-secondary-900/20 dark:to-accent-900/20">
              <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-600 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="mb-3">Skill Development</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access curated courses and learning paths to bridge skill gaps and advance your career.
              </p>
            </div>

            {/* Professional Network */}
            <div className="card text-center hover:shadow-xl transition-shadow bg-gradient-to-br from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="mb-3">Professional Network</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Build your professional profile, connect with peers, and showcase your projects.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-300">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">500+</div>
              <div className="text-gray-600 dark:text-gray-300">Companies</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">1000+</div>
              <div className="text-gray-600 dark:text-gray-300">Job Openings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">100+</div>
              <div className="text-gray-600 dark:text-gray-300">Courses</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="mb-2">Create Your Profile</h4>
              <p className="text-gray-600">
                Build a comprehensive profile showcasing your education, skills, and projects.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="mb-2">Get Matched</h4>
              <p className="text-gray-600">
                Receive personalized job recommendations based on your profile and preferences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="mb-2">Land Your Dream Job</h4>
              <p className="text-gray-600">
                Apply with one click, track applications, and connect with employers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of students who have found their dream careers through our platform.
          </p>
          <Link href="/auth/register" className="btn bg-white text-primary-600 hover:bg-gray-100 text-lg px-8 py-3">
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white mb-4">CollabX BD</h3>
              <p className="text-sm">
                Empowering students to achieve their career goals through intelligent matching and skill development.
              </p>
            </div>
            
            <div>
              <h4 className="text-white mb-4">For Students</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/jobs" className="hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/courses" className="hover:text-white">Courses</Link></li>
                <li><Link href="/profile" className="hover:text-white">Create Profile</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white mb-4">For Employers</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/employer/post-job" className="hover:text-white">Post a Job</Link></li>
                <li><Link href="/employer/search" className="hover:text-white">Search Candidates</Link></li>
                <li><Link href="/employer/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2026 Student Employability Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
