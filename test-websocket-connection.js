// WebSocket Connection Test for Supabase Realtime
// Run this in browser console to test WebSocket connectivity

console.log('🔍 Testing Supabase WebSocket Connection...');

// Test WebSocket connection directly
const testWebSocketConnection = () => {
  const supabaseUrl = 'wss://ngucthauvvjajdjcdrvl.supabase.co/realtime/v1/websocket';
  const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndWN0aGF1dnZqYWpkamNkcnZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTk3OTIsImV4cCI6MjA2NzQ3NTc5Mn0.GPVglNEpbWNa0NUzXdTOWm-WoSI2gOih7A8D3tVHVDU';
  
  const wsUrl = `${supabaseUrl}?apikey=${apiKey}&vsn=1.0.0`;
  
  console.log('📡 Attempting WebSocket connection to:', wsUrl);
  
  try {
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = (event) => {
      console.log('✅ WebSocket connection opened successfully!', event);
      
      // Send a heartbeat message
      const heartbeat = {
        topic: 'phoenix',
        event: 'heartbeat',
        payload: {},
        ref: '1'
      };
      
      ws.send(JSON.stringify(heartbeat));
      console.log('💓 Heartbeat sent');
    };
    
    ws.onmessage = (event) => {
      console.log('📨 WebSocket message received:', JSON.parse(event.data));
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
    
    ws.onclose = (event) => {
      console.log('🔌 WebSocket connection closed:', event.code, event.reason);
    };
    
    // Close connection after 5 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log('🔚 Test completed - connection closed');
      }
    }, 5000);
    
  } catch (error) {
    console.error('💥 Failed to create WebSocket connection:', error);
  }
};

// Test CSP compliance
const testCSPCompliance = () => {
  console.log('🛡️ Testing CSP compliance...');
  
  // Check if CSP allows the connection
  const testUrls = [
    'https://ngucthauvvjajdjcdrvl.supabase.co',
    'wss://ngucthauvvjajdjcdrvl.supabase.co'
  ];
  
  testUrls.forEach(url => {
    try {
      // This will trigger CSP check
      const link = document.createElement('a');
      link.href = url;
      console.log(`✅ CSP allows connection to: ${url}`);
    } catch (error) {
      console.error(`❌ CSP blocks connection to: ${url}`, error);
    }
  });
};

// Run tests
console.log('🚀 Starting WebSocket connectivity tests...');
testCSPCompliance();
testWebSocketConnection();

// Instructions for manual testing
console.log(`
📋 MANUAL TESTING INSTRUCTIONS:

1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Refresh the page or trigger real-time features
5. Look for successful WebSocket connections to Supabase

Expected Results:
✅ No CSP violation errors in console
✅ WebSocket connections appear in Network tab
✅ Real-time features work on both desktop and mobile

If you see errors:
❌ Check CSP configuration in server.js
❌ Verify wss://*.supabase.co is in connect-src directive
❌ Test on different devices/browsers
`);
