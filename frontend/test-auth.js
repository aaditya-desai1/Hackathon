// Simple script to test authentication API endpoints
const API_URL = 'http://localhost:5000';

async function testAuth() {
  console.log('Testing Authentication API...');
  
  try {
    // Test login with existing user
    console.log('\n1. Testing login endpoint:');
    const loginResult = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'aadi@gmail.com',
        password: 'password123'
      })
    });
    
    console.log('Login status:', loginResult.status);
    console.log('Login status text:', loginResult.statusText);
    
    if (loginResult.ok) {
      const loginData = await loginResult.json();
      console.log('Login success:', JSON.stringify(loginData, null, 2));
    } else {
      try {
        const errorData = await loginResult.json();
        console.log('Login error response:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
    // Test registration with new user
    console.log('\n2. Testing registration endpoint:');
    const registrationResult = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser' + Math.floor(Math.random() * 1000),
        email: 'testuser' + Math.floor(Math.random() * 1000) + '@example.com',
        password: 'password123'
      })
    });
    
    console.log('Registration status:', registrationResult.status);
    console.log('Registration status text:', registrationResult.statusText);
    
    if (registrationResult.ok) {
      const registrationData = await registrationResult.json();
      console.log('Registration success:', JSON.stringify(registrationData, null, 2));
      
      // Test profile endpoint with token
      if (registrationData.token) {
        console.log('\n3. Testing profile endpoint with token:');
        const profileResult = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${registrationData.token}`
          }
        });
        
        console.log('Profile status:', profileResult.status);
        console.log('Profile status text:', profileResult.statusText);
        
        if (profileResult.ok) {
          const profileData = await profileResult.json();
          console.log('Profile data:', JSON.stringify(profileData, null, 2));
        } else {
          try {
            const errorData = await profileResult.json();
            console.log('Profile error response:', errorData);
          } catch (e) {
            console.log('Could not parse error response');
          }
        }
      }
    } else {
      try {
        const errorData = await registrationResult.json();
        console.log('Registration error response:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuth().then(() => console.log('Auth testing completed')); 