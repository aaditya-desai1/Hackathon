// Test registration endpoint directly
const API_URL = 'http://localhost:5000'; 

async function testRegistration() {
  console.log('Testing registration endpoint directly...');
  
  // Generate a unique username and email
  const uniqueId = Math.floor(Math.random() * 10000);
  
  // New user to register
  const newUser = {
    username: `testuser${uniqueId}`,
    email: `testuser${uniqueId}@example.com`,
    password: 'Test123456'  // A secure password for testing
  };
  
  console.log('Attempting to register user:', newUser);
  
  try {
    console.log('Sending POST request to:', `${API_URL}/api/users/register`);
    const response = await fetch(`${API_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newUser)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    // Get response as text first
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    // Try to parse as JSON if possible
    try {
      const data = JSON.parse(responseText);
      console.log('Registration response data:', data);
      
      if (data.token) {
        console.log('Registration successful! Token received.');
        console.log('Test user created successfully. Use these credentials to log in:');
        console.log(`Email: ${newUser.email}`);
        console.log(`Password: ${newUser.password}`);
        
        // Now try to immediately log in with the new user
        console.log('\nTesting login with the newly registered user...');
        const loginResponse = await fetch(`${API_URL}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: newUser.email,
            password: newUser.password
          })
        });
        
        console.log('Login response status:', loginResponse.status);
        const loginData = await loginResponse.json();
        console.log('Login response data:', loginData);
        
        if (loginData.token) {
          console.log('Login successful with the new user! Everything is working correctly.');
        } else {
          console.log('Login failed with the new user.');
        }
      } else {
        console.log('No token in response, registration might have failed.');
      }
    } catch (jsonError) {
      console.error('Could not parse response as JSON:', jsonError.message);
    }
  } catch (error) {
    console.error('Registration test failed:', error.message);
  }
}

// Execute the test
testRegistration()
  .then(() => console.log('Registration test completed'))
  .catch(err => console.error('Unexpected error:', err)); 