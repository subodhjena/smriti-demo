const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', function open() {
  console.log('Connected to WebSocket server');
  
  // Wait a bit for the OpenAI session to be established
  setTimeout(() => {
    // Send a test text message
    const testMessage = {
      type: 'text_message',
      payload: { text: 'Hello, this is a test message' }
    };
    
    console.log('Sending test message:', testMessage);
    ws.send(JSON.stringify(testMessage));
  }, 2000); // Wait 2 seconds for OpenAI session to be ready
});

ws.on('message', function message(data) {
  try {
    const parsed = JSON.parse(data.toString());
    console.log('Received message:', JSON.stringify(parsed, null, 2));
  } catch (error) {
    console.log('Raw message:', data.toString());
  }
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close() {
  console.log('WebSocket connection closed');
});

// Keep the script running for 30 seconds
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 30000); 