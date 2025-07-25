#!/usr/bin/env node

/**
 * Maintenance Mode Protection Test Script
 * 
 * This script tests the maintenance mode route protection by making HTTP requests
 * to various routes and checking if they are properly blocked or allowed.
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:8081';

// Routes that should be blocked during maintenance
const BLOCKED_ROUTES = [
  '/shop',
  '/cart',
  '/checkout',
  '/orders',
  '/account',
  '/payment-success',
  '/finish-payment',
  '/payment-error'
];

// Routes that should always be allowed
const ALLOWED_ROUTES = [
  '/',
  '/auth',
  '/admin',
  '/test-connection',
  '/debug-products',
  '/simple-test',
  '/maintenance-test',
  '/route-test',
  '/maintenance-debug'
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testRoute(route) {
  try {
    const response = await makeRequest(`${BASE_URL}${route}`);
    
    // Check if the response contains maintenance notice
    const isMaintenancePage = response.body.includes('maintenance') || 
                             response.body.includes('Maintenance') ||
                             response.body.includes('MaintenanceNotice');
    
    // Check if it's a redirect (3xx status codes)
    const isRedirect = response.statusCode >= 300 && response.statusCode < 400;
    
    return {
      route,
      statusCode: response.statusCode,
      isMaintenancePage,
      isRedirect,
      success: response.statusCode === 200,
      redirectLocation: response.headers.location || null
    };
  } catch (error) {
    return {
      route,
      statusCode: null,
      isMaintenancePage: false,
      isRedirect: false,
      success: false,
      error: error.message
    };
  }
}

async function checkMaintenanceStatus() {
  try {
    console.log('🔍 Checking maintenance status...');
    const response = await makeRequest(`${BASE_URL}/maintenance-debug`);
    
    if (response.statusCode === 200) {
      console.log('✅ Maintenance debug panel accessible');
      
      // Try to extract maintenance status from the response
      const isMaintenanceEnabled = response.body.includes('Enabled:</strong>') && 
                                  response.body.includes('YES');
      
      console.log(`📊 Maintenance appears to be: ${isMaintenanceEnabled ? 'ENABLED' : 'DISABLED'}`);
      return isMaintenanceEnabled;
    } else {
      console.log('❌ Could not access maintenance debug panel');
      return null;
    }
  } catch (error) {
    console.log('❌ Error checking maintenance status:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Starting Maintenance Mode Protection Tests...\n');
  
  // Check if server is running
  try {
    await makeRequest(`${BASE_URL}/`);
    console.log('✅ Server is running at', BASE_URL);
  } catch (error) {
    console.log('❌ Server is not running at', BASE_URL);
    console.log('   Please start the development server with: npm run dev');
    process.exit(1);
  }
  
  // Check maintenance status
  const maintenanceEnabled = await checkMaintenanceStatus();
  console.log('');
  
  // Test allowed routes
  console.log('📋 Testing ALLOWED routes (should always be accessible):');
  console.log('='.repeat(60));
  
  for (const route of ALLOWED_ROUTES) {
    const result = await testRoute(route);
    
    if (result.success && !result.isMaintenancePage) {
      console.log(`✅ ${route.padEnd(20)} - Accessible (${result.statusCode})`);
    } else if (result.isMaintenancePage) {
      console.log(`⚠️  ${route.padEnd(20)} - Shows maintenance page (unexpected)`);
    } else {
      console.log(`❌ ${route.padEnd(20)} - Not accessible (${result.statusCode || 'ERROR'})`);
    }
  }
  
  console.log('');
  
  // Test blocked routes
  console.log('🚫 Testing BLOCKED routes (behavior depends on maintenance status):');
  console.log('='.repeat(60));
  
  for (const route of BLOCKED_ROUTES) {
    const result = await testRoute(route);
    
    if (maintenanceEnabled === true) {
      // Maintenance is enabled - routes should be blocked
      if (result.isMaintenancePage) {
        console.log(`✅ ${route.padEnd(20)} - Correctly blocked (shows maintenance)`);
      } else if (result.success) {
        console.log(`❌ ${route.padEnd(20)} - NOT BLOCKED (should show maintenance)`);
      } else {
        console.log(`⚠️  ${route.padEnd(20)} - Error accessing (${result.statusCode || 'ERROR'})`);
      }
    } else if (maintenanceEnabled === false) {
      // Maintenance is disabled - routes should be accessible
      if (result.success && !result.isMaintenancePage) {
        console.log(`✅ ${route.padEnd(20)} - Accessible (maintenance disabled)`);
      } else if (result.isMaintenancePage) {
        console.log(`❌ ${route.padEnd(20)} - Shows maintenance (should be accessible)`);
      } else {
        console.log(`⚠️  ${route.padEnd(20)} - Error accessing (${result.statusCode || 'ERROR'})`);
      }
    } else {
      // Unknown maintenance status
      if (result.success) {
        console.log(`? ${route.padEnd(20)} - Accessible (status unknown)`);
      } else if (result.isMaintenancePage) {
        console.log(`? ${route.padEnd(20)} - Shows maintenance (status unknown)`);
      } else {
        console.log(`? ${route.padEnd(20)} - Error accessing (${result.statusCode || 'ERROR'})`);
      }
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('🎯 TEST SUMMARY');
  console.log('='.repeat(60));
  
  if (maintenanceEnabled === true) {
    console.log('📊 Maintenance Status: ENABLED');
    console.log('✅ Expected: Allowed routes accessible, blocked routes show maintenance');
  } else if (maintenanceEnabled === false) {
    console.log('📊 Maintenance Status: DISABLED');
    console.log('✅ Expected: All routes accessible normally');
  } else {
    console.log('📊 Maintenance Status: UNKNOWN');
    console.log('⚠️  Could not determine maintenance status');
  }
  
  console.log('');
  console.log('🔧 Manual Testing:');
  console.log('   1. Visit /maintenance-debug to check current status');
  console.log('   2. Toggle maintenance mode and test routes');
  console.log('   3. Visit /maintenance-test for interactive testing');
  console.log('   4. Visit /route-test for route accessibility testing');
  console.log('');
  console.log('🌐 Debug URLs:');
  console.log(`   • Debug Panel: ${BASE_URL}/maintenance-debug`);
  console.log(`   • Test Panel: ${BASE_URL}/maintenance-test`);
  console.log(`   • Route Test: ${BASE_URL}/route-test`);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
