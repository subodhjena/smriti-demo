#!/usr/bin/env node

/**
 * Audio Flow Debug Test
 * Tests the complete audio flow from browser to OpenAI
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://localhost:3000';
const TEST_DURATION = 5000; // 5 seconds

console.log('🧪 Audio Flow Debug Test');
console.log('='.repeat(50));

// Generate test PCM16 audio data (sine wave) - FIXED VERSION
function generateTestAudio(durationMs = 1000, frequency = 440) {
  const sampleRate = 24000;
  const samples = Math.floor(sampleRate * durationMs / 1000);
  
  console.log(`🎵 Generating ${durationMs}ms audio at ${frequency}Hz (${samples} samples)`);
  
  // Create PCM16 data (16-bit signed integers, little-endian)
  const buffer = Buffer.alloc(samples * 2); // 2 bytes per sample
  
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * frequency * time) * 0.5; // Reduce amplitude
    const sample = Math.round(amplitude * 32767); // Convert to 16-bit signed
    
    // Write as little-endian 16-bit signed integer
    buffer.writeInt16LE(sample, i * 2);
  }
  
  // Convert to base64
  const base64 = buffer.toString('base64');
  
  console.log(`📊 Generated audio: ${buffer.length} bytes, ${base64.length} base64 chars`);
  console.log(`📏 Expected duration: ${(samples / sampleRate * 1000).toFixed(1)}ms`);
  
  return base64;
}

async function testAudioFlow() {
  return new Promise((resolve, reject) => {
    console.log('📡 Connecting to WebSocket server...');
    
    const ws = new WebSocket(WS_URL);
    let connected = false;
    let sessionId = null;
    let audioSent = false;
    const responsesReceived = [];
    
    const timeout = setTimeout(() => {
      if (!connected) {
        reject(new Error('Connection timeout'));
      } else {
        resolve({
          connected: true,
          sessionId,
          audioSent,
          responsesReceived
        });
      }
      ws.close();
    }, TEST_DURATION);
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected');
      connected = true;
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📨 Received: ${message.type}`);
        responsesReceived.push(message.type);
        
        if (message.type === 'welcome') {
          sessionId = message.payload.sessionId;
          console.log(`🎉 Session created: ${sessionId}`);
          
          // Send test audio data after a delay
          setTimeout(() => {
            console.log('🎵 Sending test audio data...');
            
            // Generate 1 second of audio (should be well above 100ms minimum)
            const testAudio = generateTestAudio(1000, 440); // 1000ms 440Hz tone
            
            ws.send(JSON.stringify({
              type: 'audio_data',
              payload: { audio: testAudio }
            }));
            
            console.log(`📤 Sent audio data: ${testAudio.length} characters`);
            audioSent = true;
            
            // Commit audio after a short delay
            setTimeout(() => {
              console.log('✅ Committing audio buffer...');
              ws.send(JSON.stringify({
                type: 'audio_commit',
                payload: {}
              }));
            }, 200);
            
          }, 1000); // Wait 1 second after session creation
        }
        
        if (message.type === 'speech_started') {
          console.log('🎤 OpenAI VAD detected speech start');
        }
        
        if (message.type === 'speech_stopped') {
          console.log('🔇 OpenAI VAD detected speech end');
        }
        
        if (message.type === 'audio_delta') {
          const deltaSize = message.payload.delta?.length || 0;
          console.log(`🔊 Received audio delta: ${deltaSize} chars`);
        }
        
        if (message.type === 'text_delta') {
          console.log(`💬 Text delta: "${message.payload.delta}"`);
        }
        
        if (message.type === 'audio_transcript_delta') {
          console.log(`📝 Transcript delta: "${message.payload.delta}"`);
        }
        
        if (message.type === 'error') {
          console.error('❌ Server error:', JSON.stringify(message.payload, null, 2));
        }
        
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} ${reason}`);
      clearTimeout(timeout);
      
      if (connected) {
        resolve({
          connected: true,
          sessionId,
          audioSent,
          responsesReceived
        });
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Run the test
async function main() {
  try {
    console.log('🚀 Starting audio flow test...\n');
    
    const result = await testAudioFlow();
    
    console.log('\n📊 Test Results:');
    console.log('='.repeat(30));
    console.log(`✅ Connected: ${result.connected}`);
    console.log(`📦 Session ID: ${result.sessionId}`);
    console.log(`🎵 Audio sent: ${result.audioSent}`);
    console.log(`📨 Responses received: ${result.responsesReceived.length}`);
    
    // Count specific response types
    const speechStarted = result.responsesReceived.filter(r => r === 'speech_started').length;
    const audioDeltas = result.responsesReceived.filter(r => r === 'audio_delta').length;
    const textDeltas = result.responsesReceived.filter(r => r === 'text_delta').length;
    const errors = result.responsesReceived.filter(r => r === 'error').length;
    
    console.log(`🎤 Speech detection: ${speechStarted} events`);
    console.log(`🔊 Audio deltas: ${audioDeltas}`);
    console.log(`💬 Text deltas: ${textDeltas}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Analysis
    console.log('\n🔍 Analysis:');
    if (!result.connected) {
      console.log('❌ Could not connect to WebSocket server');
      console.log('💡 Make sure the server is running on port 3000');
    } else if (!result.sessionId) {
      console.log('❌ No session created');
      console.log('💡 Check authentication and session management');
    } else if (!result.audioSent) {
      console.log('❌ Audio was not sent');
      console.log('💡 Check audio data generation and sending logic');
    } else if (errors > 0) {
      console.log('❌ Errors occurred during processing');
      console.log('💡 Check the error messages above for details');
    } else if (speechStarted === 0) {
      console.log('❌ OpenAI VAD did not detect speech');
      console.log('💡 Audio format might be incorrect or too quiet');
    } else if (audioDeltas === 0 && textDeltas === 0) {
      console.log('❌ No AI response received');
      console.log('💡 Check OpenAI API key and response generation');
    } else {
      console.log('✅ Audio flow is working correctly!');
      console.log(`🎉 Detected ${speechStarted} speech events`);
      console.log(`📊 Received ${audioDeltas} audio deltas and ${textDeltas} text deltas`);
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Make sure the WebSocket server is running:');
      console.log('   npx nx serve ws-server');
    }
  }
}

main(); 