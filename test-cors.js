// Test script to check CORS setup for our API
const BACKEND_URL = 'https://express-backend-7m2c.onrender.com';

async function testCORS() {
  console.log('Testing CORS setup...');
  
  // Username with timestamp to avoid duplicate user errors
  const timestamp = new Date().getTime();
  const username = `test_user_${timestamp}`;
  
  const payload = {
    username: username,
    email: `${username}@example.com`,
    password: 'Test123456'
  };
  
  console.log('Testing registration with payload:', payload);
  
  try {
    // Try direct fetch with credentials mode
    const response = await fetch(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://datavizpro-kn4junf9m-aaditya-desais-projects.vercel.app'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.token) {
      console.log('Registration successful!');
      
      // Now test with the obtained token
      try {
        const profileResponse = await fetch(`${BACKEND_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Origin': 'https://datavizpro-kn4junf9m-aaditya-desais-projects.vercel.app'
          },
          credentials: 'include'
        });
        
        console.log('Profile response status:', profileResponse.status);
        const profileData = await profileResponse.json();
        console.log('Profile data:', profileData);
      } catch (profileError) {
        console.error('Profile request error:', profileError);
      }
    }
  } catch (error) {
    console.error('Registration request error:', error);
  }
  
  // Test without credentials mode
  try {
    console.log('\nTesting without credentials mode...');
    const response2 = await fetch(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://datavizpro-kn4junf9m-aaditya-desais-projects.vercel.app'
      },
      body: JSON.stringify({
        username: `${username}_2`,
        email: `${username}_2@example.com`,
        password: 'Test123456'
      })
    });
    
    console.log('Response 2 status:', response2.status);
    const data2 = await response2.json();
    console.log('Response 2 data:', data2);
  } catch (error2) {
    console.error('Second registration request error:', error2);
  }
}

// Run the test
testCORS(); 