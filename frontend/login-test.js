// Test login endpoint directly
const API_URL = 'http://localhost:5000'; 

async function testLogin() {
  console.log('Testing login endpoint directly...');
  
  // Credentials to test with
  const testCreds = {
    email: 'aadi@gmail.com', // Replace with your test user email
    password: 'password123'  // Replace with your test user password
  };
  
  console.log('Testing with credentials:', testCreds);
  
  try {
    console.log('Sending POST request to:', `${API_URL}/api/users/login`);
    const response = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testCreds)
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers]));
    
    // Get response as text first
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    // Try to parse as JSON if possible
    try {
      const data = JSON.parse(responseText);
      console.log('Login response data:', data);
      
      if (data.token) {
        console.log('Login successful! Token received.');
      } else {
        console.log('No token in response, login might have failed.');
      }
    } catch (jsonError) {
      console.error('Could not parse response as JSON:', jsonError.message);
    }
  } catch (error) {
    console.error('Login test failed:', error.message);
  }
}

// Execute the test
testLogin()
  .then(() => console.log('Login test completed'))
  .catch(err => console.error('Unexpected error:', err)); 