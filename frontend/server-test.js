// Simple script to test server connectivity
async function testServerConnection() {
  console.log('Testing server connectivity...');
  
  try {
    console.log('Testing connection to http://localhost:5000/health');
    const response = await fetch('http://localhost:5000/health');
    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Health check response:', data);
    } else {
      console.error('Health check failed with status:', response.status);
    }
  } catch (error) {
    console.error('Server connection error:', error.message);
  }
  
  try {
    console.log('\nTesting connection to http://localhost:5000/api/test');
    const testResponse = await fetch('http://localhost:5000/api/test');
    console.log('Test Response status:', testResponse.status);
    console.log('Test Response OK:', testResponse.ok);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('API test response:', testData);
    } else {
      console.error('API test failed with status:', testResponse.status);
    }
  } catch (error) {
    console.error('API test connection error:', error.message);
  }
}

testServerConnection()
  .then(() => console.log('Server connectivity tests completed'))
  .catch(err => console.error('Unexpected error in test script:', err)); 