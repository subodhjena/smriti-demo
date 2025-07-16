#!/usr/bin/env node

/**
 * Simple Audio Debug Test
 * Sends very small audio chunks to debug the buffer issue
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000';

// Generate minimal PCM16 audio data (just 200ms)
function generateMinimalAudio() {
  const sampleRate = 24000;
  const durationMs = 200; // Very short test
  const samples = Math.floor(sampleRate * durationMs / 1000);
  
  console.log(`🎵 Generating ${durationMs}ms of audio (${samples} samples)`);
  
  const buffer = Buffer.alloc(samples * 2);
  
  // Generate a simple 440Hz sine wave
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * 440 * time) * 0.8; // Louder
    const sample = Math.round(amplitude * 32767);
    buffer.writeInt16LE(sample, i * 2);
  }
  
  const base64 = buffer.toString('base64');
  console.log(`📊 Generated: ${buffer.length} bytes → ${base64.length} base64 chars`);
  
  return base64;
}

async function testMinimalAudio() {
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
        
        // Send VERY small audio chunk
        setTimeout(() => {
          console.log('📤 Sending minimal audio...');
          const audioData = generateMinimalAudio();
          
          ws.send(JSON.stringify({
            type: 'audio_data',
            payload: { audio: audioData }
          }));
          
          // Try committing after 500ms
          setTimeout(() => {
            console.log('💾 Committing audio...');
            ws.send(JSON.stringify({
              type: 'audio_commit',
              payload: {}
            }));
          }, 500);
          
        }, 1000);
      }
      
      if (message.type === 'error') {
        console.error('❌ Error:', message.payload);
      }
      
      if (message.type === 'speech_started') {
        console.log('🎤 Speech detected!');
      }
      
      if (message.type === 'response_done') {
        console.log('✅ Response completed');
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
    console.log('🧪 Minimal Audio Test');
    console.log('='.repeat(30));
    
    const events = await testMinimalAudio();
    
    const errors = events.filter(e => e.type === 'error');
    const speechEvents = events.filter(e => e.type === 'speech_started');
    
    console.log(`\n📊 Results:`);
    console.log(`- Total events: ${events.length}`);
    console.log(`- Errors: ${errors.length}`);
    console.log(`- Speech detected: ${speechEvents.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(error => {
        console.log(`  - ${error.payload.message}`);
        if (error.payload.error) {
          console.log(`    Code: ${error.payload.error.code}`);
          console.log(`    Details: ${error.payload.error.message}`);
        }
      });
    }
    
    if (speechEvents.length > 0) {
      console.log('\n✅ Success! Audio was detected by OpenAI VAD');
    } else if (errors.length === 0) {
      console.log('\n⚠️  No speech detected, but no errors either');
    } else {
      console.log('\n❌ Audio detection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main(); 