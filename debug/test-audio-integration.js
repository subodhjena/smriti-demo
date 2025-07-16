#!/usr/bin/env node

/**
 * Audio Integration Test
 * Tests the complete audio flow: WebSocket connection, audio streaming, and OpenAI integration
 */

const WebSocket = require('ws');
const fs = require('fs');

const WS_URL = 'ws://localhost:3000';

// Simple PCM16 audio data generator for testing
function generateTestAudioData() {
  // Generate 0.1 seconds of 24kHz PCM16 data (sine wave at 440Hz)
  const sampleRate = 24000;
  const duration = 0.1; // 100ms
  const frequency = 440; // A4 note
  const samples = Math.floor(sampleRate * duration);
  
  const buffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
  
  for (let i = 0; i < samples; i++) {
    const time = i / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * frequency * time);
    const sample = Math.round(amplitude * 32767); // Convert to 16-bit
    buffer.writeInt16LE(sample, i * 2);
  }
  
  return buffer.toString('base64');
}

async function testAudioIntegration() {
  console.log('🎵 Testing Audio Integration...\n');
  
  const ws = new WebSocket(WS_URL);
  let sessionId = null;
  const events = [];
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('⏱️  Test timeout reached');
      ws.close();
      resolve(events);
    }, 15000);
    
    ws.on('open', () => {
      console.log('✅ Connected to WebSocket server');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      events.push(message);
      
      console.log(`📨 Received: ${message.type}`);
      
      if (message.type === 'welcome') {
        sessionId = message.payload?.sessionId || message.sessionId;
        console.log(`🎉 Session established: ${sessionId}`);
        
        // Test audio streaming after connection is established
        setTimeout(() => {
          console.log('\n🎤 Testing audio streaming...');
          testAudioStreaming(ws);
        }, 1000);
      }
      
      if (message.type === 'openai_event') {
        const event = message.payload;
        console.log(`🧠 OpenAI Event: ${event.type}`);
        
        if (event.type === 'response.audio.delta') {
          console.log(`🔊 Received audio chunk (${event.delta ? event.delta.length : 0} bytes)`);
        }
        
        if (event.type === 'response.audio_transcript.delta') {
          console.log(`📝 Transcript delta: "${event.delta}"`);
        }
        
        if (event.type === 'response.done') {
          console.log('✅ Response completed');
          clearTimeout(timeout);
          setTimeout(() => {
            ws.close();
            resolve(events);
          }, 1000);
        }
      }
      
      if (message.type === 'error' || message.type === 'openai_error') {
        console.error('❌ Error:', message.payload || message.error);
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });
}

function testAudioStreaming(ws) {
  try {
    console.log('📤 Sending audio chunks...');
    
    // Send multiple audio chunks
    const testAudio = generateTestAudioData();
    
    for (let i = 0; i < 5; i++) {
      const audioEvent = {
        type: 'openai_event',
        payload: {
          type: 'input_audio_buffer.append',
          audio: testAudio,
        },
        timestamp: new Date().toISOString(),
      };
      
      ws.send(JSON.stringify(audioEvent));
      console.log(`📤 Sent audio chunk ${i + 1}/5`);
    }
    
    // Commit the audio buffer
    setTimeout(() => {
      console.log('✅ Committing audio buffer...');
      
      const commitEvent = {
        type: 'openai_event',
        payload: {
          type: 'input_audio_buffer.commit',
        },
        timestamp: new Date().toISOString(),
      };
      
      ws.send(JSON.stringify(commitEvent));
      
      // Request AI response with audio
      setTimeout(() => {
        console.log('🤖 Requesting AI response with audio...');
        
        const responseEvent = {
          type: 'openai_event',
          payload: {
            type: 'response.create',
            response: {
              modalities: ['text', 'audio'],
            },
          },
          timestamp: new Date().toISOString(),
        };
        
        ws.send(JSON.stringify(responseEvent));
      }, 500);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error in audio streaming test:', error.message);
  }
}

// Run the test
async function main() {
  try {
    console.log('🚀 Starting Audio Integration Test\n');
    console.log('This test will:');
    console.log('1. Connect to WebSocket server');
    console.log('2. Send audio chunks to OpenAI');
    console.log('3. Commit audio buffer');
    console.log('4. Request AI response with audio');
    console.log('5. Check for audio and transcript responses\n');
    
    const events = await testAudioIntegration();
    
    console.log('\n📊 Test Summary:');
    console.log(`Total events received: ${events.length}`);
    
    const openaiEvents = events.filter(e => e.type === 'openai_event');
    console.log(`OpenAI events: ${openaiEvents.length}`);
    
    const audioEvents = openaiEvents.filter(e => e.payload?.type?.includes('audio'));
    console.log(`Audio-related events: ${audioEvents.length}`);
    
    const hasAudioDelta = openaiEvents.some(e => e.payload?.type === 'response.audio.delta');
    const hasTranscript = openaiEvents.some(e => e.payload?.type === 'response.audio_transcript.delta');
    
    console.log(`✅ Audio streaming: ${hasAudioDelta ? 'SUCCESS' : 'FAILED'}`);
    console.log(`✅ Transcript generation: ${hasTranscript ? 'SUCCESS' : 'FAILED'}`);
    
    if (hasAudioDelta && hasTranscript) {
      console.log('\n🎉 Audio integration test PASSED!');
    } else {
      console.log('\n⚠️  Audio integration test had issues - check server logs');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 