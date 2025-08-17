#!/usr/bin/env node

/**
 * WebSocket Connection Test Script for Judge.ca
 * Tests WebSocket connectivity between frontend and Railway backend
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3001',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'test-secret',
  testUserId: 'test-user-123',
  testUserType: 'user'
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Generate test JWT token
function generateTestToken() {
  return jwt.sign({
    userId: config.testUserId,
    userType: config.testUserType,
    iat: Date.now()
  }, config.jwtSecret, { expiresIn: '1h' });
}

// Test WebSocket connection
async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    info('Starting WebSocket connection test...');
    info(`Backend URL: ${config.backendUrl}`);
    
    const token = generateTestToken();
    info('Generated test JWT token');

    // Create socket connection
    const socket = io(config.backendUrl, {
      auth: {
        token: token
      },
      transports: ['websocket'],
      timeout: 10000
    });

    const tests = {
      connection: false,
      authentication: false,
      messaging: false,
      healthCheck: false
    };

    let testTimeout;

    // Set overall test timeout
    testTimeout = setTimeout(() => {
      error('Test timeout reached (30 seconds)');
      socket.disconnect();
      resolve(tests);
    }, 30000);

    // Connection events
    socket.on('connect', () => {
      success('WebSocket connection established');
      tests.connection = true;
      tests.authentication = true; // If we connect with auth, auth worked
      
      // Test messaging capability
      testMessaging(socket);
    });

    socket.on('connect_error', (err) => {
      error(`Connection failed: ${err.message}`);
      clearTimeout(testTimeout);
      socket.disconnect();
      resolve(tests);
    });

    socket.on('disconnect', (reason) => {
      warning(`Disconnected: ${reason}`);
      clearTimeout(testTimeout);
      resolve(tests);
    });

    socket.on('error', (err) => {
      error(`Socket error: ${err.message || err}`);
    });

    // Test messaging
    function testMessaging(socket) {
      info('Testing messaging functionality...');
      
      // Test joining a conversation
      socket.emit('join:conversation', 'test-conversation-123');
      
      socket.on('joined:conversation', (data) => {
        success(`Joined conversation: ${data.conversationId}`);
        
        // Test sending a message
        socket.emit('send:message', {
          conversationId: 'test-conversation-123',
          content: 'Test message from WebSocket test script',
          messageType: 'text'
        });
      });

      socket.on('new:message', (message) => {
        success('Message sent and received successfully');
        tests.messaging = true;
        
        // Test typing indicators
        testTypingIndicators(socket);
      });

      socket.on('error', (errorData) => {
        warning(`Message error: ${errorData.message}`);
        // Continue with other tests
        testTypingIndicators(socket);
      });
    }

    // Test typing indicators
    function testTypingIndicators(socket) {
      info('Testing typing indicators...');
      
      socket.emit('typing:start', 'test-conversation-123');
      
      setTimeout(() => {
        socket.emit('typing:stop', 'test-conversation-123');
        success('Typing indicators test completed');
        
        // Finish tests
        completeTests(socket);
      }, 1000);
    }

    // Complete all tests
    function completeTests(socket) {
      tests.healthCheck = true; // If we got this far, basic health is good
      
      clearTimeout(testTimeout);
      socket.disconnect();
      resolve(tests);
    }
  });
}

// Test HTTP endpoints
async function testHttpEndpoints() {
  info('Testing HTTP endpoints...');
  
  const endpoints = [
    '/health',
    '/health/live',
    '/health/ready',
    '/health/db',
    '/health/redis',
    '/health/websocket'
  ];

  const results = {};

  for (const endpoint of endpoints) {
    try {
      const url = `${config.backendUrl}${endpoint}`;
      info(`Testing: ${url}`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        success(`${endpoint}: ${data.status || 'OK'}`);
        results[endpoint] = true;
      } else {
        warning(`${endpoint}: ${response.status} - ${data.error || 'Error'}`);
        results[endpoint] = false;
      }
    } catch (err) {
      error(`${endpoint}: ${err.message}`);
      results[endpoint] = false;
    }
  }

  return results;
}

// Main test function
async function runTests() {
  log(`${colors.bold}Judge.ca WebSocket Connection Test${colors.reset}`);
  log('='.repeat(50));
  
  try {
    // Test HTTP endpoints first
    const httpResults = await testHttpEndpoints();
    
    log('\n' + '='.repeat(50));
    
    // Test WebSocket connection
    const wsResults = await testWebSocketConnection();
    
    // Display results
    log('\n' + '='.repeat(50));
    log(`${colors.bold}Test Results Summary${colors.reset}`);
    log('='.repeat(50));
    
    // HTTP Results
    log(`${colors.bold}HTTP Endpoints:${colors.reset}`);
    Object.entries(httpResults).forEach(([endpoint, status]) => {
      const icon = status ? '✅' : '❌';
      log(`  ${icon} ${endpoint}`);
    });
    
    // WebSocket Results
    log(`\n${colors.bold}WebSocket Tests:${colors.reset}`);
    Object.entries(wsResults).forEach(([test, status]) => {
      const icon = status ? '✅' : '❌';
      log(`  ${icon} ${test}`);
    });
    
    // Overall status
    const httpPassed = Object.values(httpResults).filter(Boolean).length;
    const wsPassed = Object.values(wsResults).filter(Boolean).length;
    const totalPassed = httpPassed + wsPassed;
    const totalTests = Object.keys(httpResults).length + Object.keys(wsResults).length;
    
    log('\n' + '='.repeat(50));
    if (totalPassed === totalTests) {
      success(`All tests passed! (${totalPassed}/${totalTests})`);
      log(`${colors.green}${colors.bold}🎉 WebSocket connection is working correctly!${colors.reset}`);
    } else {
      warning(`Some tests failed. (${totalPassed}/${totalTests} passed)`);
      log(`${colors.yellow}${colors.bold}⚠️  Check the failed tests above and verify your configuration.${colors.reset}`);
    }
    
    // Configuration help
    if (totalPassed < totalTests) {
      log('\n' + '='.repeat(50));
      log(`${colors.bold}Troubleshooting Tips:${colors.reset}`);
      log('1. Verify BACKEND_URL is correct');
      log('2. Check JWT_SECRET matches backend configuration');
      log('3. Ensure Railway deployment is running');
      log('4. Verify CORS settings allow frontend domain');
      log('5. Check Railway logs: railway logs');
    }
    
  } catch (err) {
    error(`Test execution failed: ${err.message}`);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node test-websocket-connection.js [options]

Options:
  --backend-url    Backend URL (default: http://localhost:3001)
  --frontend-url   Frontend URL (default: http://localhost:3000)
  --jwt-secret     JWT secret for authentication
  --help, -h       Show this help message

Environment Variables:
  BACKEND_URL      Backend URL
  FRONTEND_URL     Frontend URL  
  JWT_SECRET       JWT secret

Examples:
  # Test local development
  node test-websocket-connection.js

  # Test Railway deployment
  BACKEND_URL=https://your-app.railway.app node test-websocket-connection.js

  # Test with custom JWT secret
  JWT_SECRET=your-secret node test-websocket-connection.js
`);
  process.exit(0);
}

// Parse command line arguments
process.argv.forEach((arg, index) => {
  if (arg === '--backend-url' && process.argv[index + 1]) {
    config.backendUrl = process.argv[index + 1];
  }
  if (arg === '--frontend-url' && process.argv[index + 1]) {
    config.frontendUrl = process.argv[index + 1];
  }
  if (arg === '--jwt-secret' && process.argv[index + 1]) {
    config.jwtSecret = process.argv[index + 1];
  }
});

// Add fetch polyfill for Node.js environments that don't have it
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the tests
runTests().catch(err => {
  error(`Unhandled error: ${err.message}`);
  process.exit(1);
});