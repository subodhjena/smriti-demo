#!/usr/bin/env node

/**
 * OpenAI Connection Validation Test
 * Tests if the OpenAI connection is working by sending text messages only
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000';

async function testOpenAIConnection() {
  const ws = new WebSocket(WS_URL);
  
  return new Promise((resolve, reject) => {
    let sessionId = null;
    const events = [];
    
    const timeout = setTimeout(() => {
      ws.close();
      resolve(events);
    }, 8000);
    
    ws.on('open', () => {
      console.log('✅ Connected to WebSocket');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      events.push(message);
      
      console.log(`📨 ${message.type}`);
      
      if (message.type === 'welcome') {
        sessionId = message.payload.sessionId;
        console.log(`🎉 Session: ${sessionId}`);
        
        // Send a simple text message instead of audio
        setTimeout(() => {
          console.log('📤 Sending text message to test OpenAI connection...');
          
          ws.send(JSON.stringify({
            type: 'text_message',
            payload: { text: 'Hello, this is a test message' }
          }));
          
        }, 1000);
      }
      
      if (message.type === 'error') {
        console.error('❌ Error:', message.payload);
      }
      
      if (message.type === 'text_delta') {
        console.log(`💬 AI Response: "${message.payload.delta}"`);
      }
      
      if (message.type === 'response_done') {
        console.log('✅ OpenAI response completed');
        clearTimeout(timeout);
        ws.close();
        resolve(events);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🧪 OpenAI Connection Validation Test');
    console.log('='.repeat(40));
    
    const events = await testOpenAIConnection();
    
    const errors = events.filter(e => e.type === 'error');
    const textDeltas = events.filter(e => e.type === 'text_delta');
    const responsesDone = events.filter(e => e.type === 'response_done');
    
    console.log(`\n📊 Results:`);
    console.log(`- Total events: ${events.length}`);
    console.log(`- Errors: ${errors.length}`);
    console.log(`- Text responses: ${textDeltas.length}`);
    console.log(`- Completed responses: ${responsesDone.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(error => {
        console.log(`  - ${error.payload.message}`);
      });
    }
    
    if (textDeltas.length > 0 && responsesDone.length > 0) {
      console.log('\n✅ SUCCESS: OpenAI connection and text messaging working!');
      console.log('💡 The issue is specifically with audio data handling');
    } else if (errors.length === 0) {
      console.log('\n⚠️  No response received, but no errors either');
      console.log('💡 OpenAI connection might be slow or hanging');
    } else {
      console.log('\n❌ OpenAI connection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 WebSocket server is not running or not accessible');
    }
  }
}

main(); 