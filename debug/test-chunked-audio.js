#!/usr/bin/env node

/**
 * Chunked Audio Debug Test
 * Sends audio in multiple chunks to debug the buffer accumulation
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000';

// Generate PCM16 audio data in chunks
function generateAudioChunk(chunkIndex, totalChunks) {
  const sampleRate = 24000;
  const totalDurationMs = 1000; // 1 second total
  const chunkDurationMs = totalDurationMs / totalChunks;
  const samplesPerChunk = Math.floor(sampleRate * chunkDurationMs / 1000);
  
  console.log(`🎵 Generating chunk ${chunkIndex + 1}/${totalChunks} (${chunkDurationMs}ms)`);
  
  const buffer = Buffer.alloc(samplesPerChunk * 2);
  
  // Generate a continuous sine wave across chunks
  for (let i = 0; i < samplesPerChunk; i++) {
    const globalSample = (chunkIndex * samplesPerChunk) + i;
    const time = globalSample / sampleRate;
    const amplitude = Math.sin(2 * Math.PI * 440 * time) * 0.8;
    const sample = Math.round(amplitude * 32767);
    buffer.writeInt16LE(sample, i * 2);
  }
  
  const base64 = buffer.toString('base64');
  console.log(`📊 Chunk ${chunkIndex + 1}: ${buffer.length} bytes → ${base64.length} base64 chars`);
  
  return base64;
}

async function testChunkedAudio() {
  const ws = new WebSocket(WS_URL);
  
  return new Promise((resolve, reject) => {
    let sessionId = null;
    const events = [];
    const numChunks = 4; // Send 4 chunks of 250ms each
    
    const timeout = setTimeout(() => {
      ws.close();
      resolve(events);
    }, 10000);
    
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
        
        // Send audio in chunks
        setTimeout(() => {
          console.log(`📤 Sending ${numChunks} audio chunks...`);
          
          // Send chunks with delays
          for (let i = 0; i < numChunks; i++) {
            setTimeout(() => {
              const audioData = generateAudioChunk(i, numChunks);
              
              ws.send(JSON.stringify({
                type: 'audio_data',
                payload: { audio: audioData }
              }));
              
              console.log(`✅ Sent chunk ${i + 1}/${numChunks}`);
              
              // Commit after all chunks are sent
              if (i === numChunks - 1) {
                setTimeout(() => {
                  console.log('💾 Committing complete audio buffer...');
                  ws.send(JSON.stringify({
                    type: 'audio_commit',
                    payload: {}
                  }));
                }, 200);
              }
              
            }, i * 100); // 100ms delay between chunks
          }
          
        }, 1000);
      }
      
      if (message.type === 'error') {
        console.error('❌ Error:', message.payload);
      }
      
      if (message.type === 'speech_started') {
        console.log('🎤 Speech detected!');
      }
      
      if (message.type === 'speech_stopped') {
        console.log('🔇 Speech ended!');
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
    console.log('🧪 Chunked Audio Test');
    console.log('='.repeat(30));
    
    const events = await testChunkedAudio();
    
    const errors = events.filter(e => e.type === 'error');
    const speechStarted = events.filter(e => e.type === 'speech_started');
    const speechStopped = events.filter(e => e.type === 'speech_stopped');
    
    console.log(`\n📊 Results:`);
    console.log(`- Total events: ${events.length}`);
    console.log(`- Errors: ${errors.length}`);
    console.log(`- Speech started: ${speechStarted.length}`);
    console.log(`- Speech stopped: ${speechStopped.length}`);
    
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
    
    if (speechStarted.length > 0) {
      console.log('\n✅ Success! Audio was detected by OpenAI VAD');
      if (speechStopped.length > 0) {
        console.log('✅ Complete speech cycle detected');
      }
    } else if (errors.length === 0) {
      console.log('\n⚠️  No speech detected, but no errors either');
      console.log('💡 This might indicate silent audio or VAD threshold issues');
    } else {
      console.log('\n❌ Audio detection failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

main(); 