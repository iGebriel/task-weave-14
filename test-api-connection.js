/**
 * Test script to verify API connection
 * Run with: node test-api-connection.js
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testApiConnection() {
  console.log('🔍 Testing API connection...');
  console.log(`📍 API Base URL: ${API_BASE_URL}`);

  try {
    // Test health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api/v1', '')}/up`);
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }

    // Test CORS
    console.log('\n2. Testing CORS...');
    const corsResponse = await fetch(`${API_BASE_URL}/projects`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type',
      },
    });

    if (corsResponse.ok) {
      console.log('✅ CORS preflight successful');
      console.log('   CORS Headers:', {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers'),
      });
    } else {
      console.log('❌ CORS preflight failed:', corsResponse.status);
    }

    // Test projects endpoint (should work in development mode)
    console.log('\n3. Testing projects endpoint...');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      console.log('✅ Projects endpoint accessible');
      console.log('   Response:', {
        success: projectsData.success,
        dataCount: projectsData.data?.length || 0,
        message: projectsData.message,
      });
    } else {
      console.log('❌ Projects endpoint failed:', projectsResponse.status, projectsResponse.statusText);
      const errorText = await projectsResponse.text();
      console.log('   Error:', errorText);
    }

    // Test authentication endpoint
    console.log('\n4. Testing authentication endpoint...');
    const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication endpoint accessible');
      console.log('   Response:', {
        success: authData.success,
        message: authData.message,
      });
    } else {
      console.log('❌ Authentication endpoint failed:', authResponse.status, authResponse.statusText);
      const errorText = await authResponse.text();
      console.log('   Error:', errorText);
    }

    console.log('\n🎉 API connection test completed!');

  } catch (error) {
    console.error('❌ API connection test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the backend server is running on http://localhost:3000');
    console.log('   2. Check if the API endpoints are accessible');
    console.log('   3. Verify CORS configuration in the backend');
    console.log('   4. Check network connectivity');
  }
}

// Run the test
testApiConnection();