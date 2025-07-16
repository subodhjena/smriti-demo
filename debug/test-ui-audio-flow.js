#!/usr/bin/env node

/**
 * Test script to debug UI audio flow
 * This script connects to the WebSocket server and monitors
 * what happens during a typical UI interaction
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000';

console.log('🔍 Debugging UI Audio Flow');
console.log('==========================\n');

const ws = new WebSocket(WS_URL);
let eventCount = 0;

ws.on('open', () => {
  console.log('✅ WebSocket connected to server');
  console.log('📡 Monitoring for audio events...\n');
  
  // Listen for any events from the server
  console.log('💡 Now test the UI:');
  console.log('   1. Open the web app (http://localhost:3001)');
  console.log('   2. Click the mic button');
  console.log('   3. Speak into microphone');
  console.log('   4. Click stop button');
  console.log('   5. Observe what events are logged here\n');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    eventCount++;
    
    console.log(`📥 Event #${eventCount}:`, {
      type: message.type,
      eventType: message.event?.type || message.payload?.type || 'unknown',
      timestamp: new Date().toLocaleTimeString(),
      hasAudio: !!(message.event?.audio || message.payload?.audio),
      audioSize: message.event?.audio?.length || message.payload?.audio?.length || 0
    });
    
    // Log specific events of interest
    if (message.type === 'openai_event') {
      const event = message.event || message.payload;
      
      switch (event?.type) {
        case 'session.created':
          console.log('🔧 OpenAI session created');
          break;
          
        case 'input_audio_buffer.append':
          console.log(`🎤 Audio chunk received: ${event.audio?.length || 0} bytes`);
          break;
          
        case 'input_audio_buffer.commit':
          console.log('📤 Audio buffer committed');
          break;
          
        case 'response.audio.delta':
          console.log(`🔊 AI audio chunk: ${event.delta?.length || 0} bytes`);
          break;
          
        case 'response.audio_transcript.delta':
          console.log(`💬 AI transcript: "${event.delta || ''}"`);
          break;
          
        case 'input_audio_buffer.speech_started':
          console.log('🎙️  Speech started detected');
          break;
          
        case 'input_audio_buffer.speech_stopped':
          console.log('⏸️  Speech stopped detected');
          break;
          
        case 'response.done':
          console.log('✅ AI response completed');
          break;
      }
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
    console.log('Raw message:', data.toString().substring(0, 200) + '...');
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('\n🔌 WebSocket connection closed');
  console.log(`📊 Total events received: ${eventCount}`);
});

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Closing connection...');
  ws.close();
  process.exit(0);
});

console.log('⌨️  Press Ctrl+C to stop monitoring\n'); 