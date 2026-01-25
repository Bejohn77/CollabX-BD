// Quick test to verify admin login
const axios = require('axios');

const testAdminLogin = async () => {
  try {
    console.log('Testing admin login...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@platform.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user);
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
  }
};

testAdminLogin();
