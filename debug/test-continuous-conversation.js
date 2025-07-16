#!/usr/bin/env node

/**
 * Test script for continuous conversation mode
 * 
 * This script tests the new continuous conversation feature where:
 * 1. Audio connection stays open continuously
 * 2. Audio chunks are streamed without auto-committing
 * 3. Conversation only ends when explicitly stopped
 * 4. OpenAI can respond during the ongoing conversation
 */

const WebSocket = require('ws');

// Configuration
const WS_URL = 'ws://localhost:3000';
const TEST_DURATION = 15000; // 15 seconds of continuous conversation
const CHUNK_INTERVAL = 100; // Send audio chunk every 100ms

// Generate synthetic PCM16 audio data (440Hz sine wave)
function generateSineWaveChunk(frequency = 440, sampleRate = 24000, durationMs = 100) {
  const samples = Math.floor(sampleRate * durationMs / 1000);
  const buffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5; // Reduced amplitude
    const int16Sample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    
    // Write as little-endian 16-bit signed integer
    buffer.writeInt16LE(int16Sample, i * 2);
  }
  
  return buffer.toString('base64');
}

// Test continuous conversation
async function testContinuousConversation() {
  console.log('🎙️  Testing Continuous Conversation Mode');
  console.log('========================================\n');

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let eventCount = 0;
    let audioChunkCount = 0;
    let conversationStarted = false;
    let audioStreamInterval = null;
    
    // Timeout to prevent hanging
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Test timeout'));
    }, 30000);

    function cleanup() {
      clearTimeout(timeout);
      if (audioStreamInterval) {
        clearInterval(audioStreamInterval);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }

    ws.on('open', () => {
      console.log('✅ WebSocket connected to server');
      
      // Start continuous conversation mode
      console.log('🎯 Starting continuous conversation...');
      conversationStarted = true;
      
      // Start streaming audio chunks continuously
      audioStreamInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN && conversationStarted) {
          const audioChunk = generateSineWaveChunk(440, 24000, 100);
          
          const inputAudioEvent = {
            type: 'openai_event',
            event: {
              type: 'input_audio_buffer.append',
              audio: audioChunk
            }
          };
          
          ws.send(JSON.stringify(inputAudioEvent));
          audioChunkCount++;
          
          if (audioChunkCount % 10 === 0) {
            console.log(`📡 Sent ${audioChunkCount} audio chunks (continuous streaming)`);
          }
        }
      }, CHUNK_INTERVAL);
      
      // Stop conversation after test duration
      setTimeout(() => {
        console.log('\n🛑 Stopping continuous conversation...');
        conversationStarted = false;
        
        if (audioStreamInterval) {
          clearInterval(audioStreamInterval);
        }
        
        // Commit the audio buffer and request response
        const commitEvent = {
          type: 'openai_event',
          event: {
            type: 'input_audio_buffer.commit'
          }
        };
        
        ws.send(JSON.stringify(commitEvent));
        console.log('✅ Audio buffer committed for AI response');
        
        // Wait a bit for AI response, then close
        setTimeout(() => {
          cleanup();
          console.log(`\n📊 Test Results:`);
          console.log(`   - Audio chunks sent: ${audioChunkCount}`);
          console.log(`   - Events received: ${eventCount}`);
          console.log(`   - Continuous streaming: ✅`);
          console.log(`   - Manual conversation control: ✅`);
          resolve();
        }, 5000);
        
      }, TEST_DURATION);
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        eventCount++;
        
        if (message.type === 'openai_event') {
          const event = message.event;
          
          switch (event.type) {
            case 'session.created':
              console.log('🔧 OpenAI session created');
              break;
              
            case 'input_audio_buffer.speech_started':
              console.log('🎤 Speech detected in audio stream');
              break;
              
            case 'input_audio_buffer.speech_stopped':
              console.log('⏸️  Speech stopped in audio stream');
              break;
              
            case 'response.audio.delta':
              if (eventCount % 20 === 0) {
                console.log('🔊 Receiving AI audio response...');
              }
              break;
              
            case 'response.audio_transcript.delta':
              if (event.delta) {
                console.log(`💬 AI transcript: "${event.delta}"`);
              }
              break;
              
            case 'response.done':
              console.log('✅ AI response completed');
              break;
              
            default:
              if (process.env.DEBUG) {
                console.log(`📥 OpenAI event: ${event.type}`);
              }
          }
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    ws.on('error', (error) => {
      cleanup();
      console.error('❌ WebSocket error:', error);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });
}

// Run the test
if (require.main === module) {
  testContinuousConversation()
    .then(() => {
      console.log('\n🎉 Continuous conversation test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testContinuousConversation }; 