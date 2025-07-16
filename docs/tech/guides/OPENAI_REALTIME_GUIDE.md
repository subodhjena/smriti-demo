# OpenAI Realtime API Guide

## Overview

The OpenAI Realtime API enables speech-to-speech conversations with AI models. This guide covers how to manage realtime conversations using WebSocket or WebRTC connections.

## Quick Start

```javascript
import WebSocket from 'ws';

const url =
  'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';
const ws = new WebSocket(url, {
  headers: {
    Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    'OpenAI-Beta': 'realtime=v1',
  },
});

ws.on('open', function open() {
  console.log('Connected to server.');
});

ws.on('message', function incoming(message) {
  console.log(JSON.parse(message.toString()));
});
```

## Core Concepts

### Realtime Session Components

A Realtime Session consists of:

- **Session object**: Controls interaction parameters (model, voice, configuration)
- **Conversation**: Represents user input Items and model output Items
- **Responses**: Model-generated audio or text Items added to the Conversation
- **Input audio buffer**: Handles audio data when using WebSockets

### Connection Methods

- **WebRTC**: Assisted media handling with WebRTC APIs
- **WebSockets**: Manual interaction with input audio buffer using JSON events with base64-encoded audio

## Session Lifecycle

### Session Initialization

After connecting, the server sends a `session.created` event. Update session configuration using `session.update`:

```javascript
const event = {
  type: 'session.update',
  session: {
    instructions: "Never use the word 'moist' in your responses!",
  },
};

dataChannel.send(JSON.stringify(event));
```

**Session Properties:**

- Maximum duration: 30 minutes
- Voice can only be changed before the model responds with audio
- Most properties can be updated at any time

### Related Events

| Client Events    | Server Events     |
| ---------------- | ----------------- |
| `session.update` | `session.created` |
|                  | `session.updated` |

## Text Input and Output

### Creating Text Messages

```javascript
const event = {
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'input_text',
        text: 'What Prince album sold the most copies?',
      },
    ],
  },
};

dataChannel.send(JSON.stringify(event));
```

### Generating Responses

```javascript
// Text-only response
const event = {
  type: 'response.create',
  response: {
    modalities: ['text'],
  },
};

dataChannel.send(JSON.stringify(event));
```

### Handling Response Events

```javascript
function handleEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === 'response.done') {
    console.log(serverEvent.response.output[0]);
  }
}

// WebRTC
dataChannel.addEventListener('message', handleEvent);

// WebSocket
ws.on('message', handleEvent);
```

### Text Event Lifecycle

| Client Events              | Server Events                 |
| -------------------------- | ----------------------------- |
| `conversation.item.create` | `conversation.item.created`   |
| `response.create`          | `response.created`            |
|                            | `response.output_item.added`  |
|                            | `response.content_part.added` |
|                            | `response.text.delta`         |
|                            | `response.text.done`          |
|                            | `response.content_part.done`  |
|                            | `response.output_item.done`   |
|                            | `response.done`               |
|                            | `rate_limits.updated`         |

## Audio Input and Output

### Voice Options

Available voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`

**Note**: Voice cannot be modified after the model emits audio in a session.

### WebRTC Audio Handling

```javascript
// Create peer connection
const pc = new RTCPeerConnection();

// Set up remote audio playback
const audioEl = document.createElement('audio');
audioEl.autoplay = true;
pc.ontrack = (e) => (audioEl.srcObject = e.streams[0]);

// Add local audio track
const ms = await navigator.mediaDevices.getUserMedia({
  audio: true,
});
pc.addTrack(ms.getTracks()[0]);
```

### WebSocket Audio Events

| Lifecycle Stage        | Client Events                                                                                           | Server Events                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session initialization | `session.update`                                                                                        | `session.created`, `session.updated`                                                                                                                                                                                                                                                                                                                                               |
| User audio input       | `conversation.item.create`, `input_audio_buffer.append`, `input_audio_buffer.commit`, `response.create` | `input_audio_buffer.speech_started`, `input_audio_buffer.speech_stopped`, `input_audio_buffer.committed`                                                                                                                                                                                                                                                                           |
| Server audio output    | `input_audio_buffer.clear`                                                                              | `conversation.item.created`, `response.created`, `response.output_item.created`, `response.content_part.added`, `response.audio.delta`, `response.audio_transcript.delta`, `response.text.delta`, `response.audio.done`, `response.audio_transcript.done`, `response.text.done`, `response.content_part.done`, `response.output_item.done`, `response.done`, `rate_limits.updated` |

### Streaming Audio Input

```javascript
import fs from 'fs';
import decodeAudio from 'audio-decode';

// Convert Float32Array to PCM16 ArrayBuffer
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

// Convert Float32Array to base64-encoded PCM16
function base64EncodeAudio(float32Array) {
  const arrayBuffer = floatTo16BitPCM(float32Array);
  let binary = '';
  let bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000; // 32KB chunk size
  for (let i = 0; i < bytes.length; i += chunkSize) {
    let chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

// Stream audio files
const files = [
  './path/to/sample1.wav',
  './path/to/sample2.wav',
  './path/to/sample3.wav',
];

for (const filename of files) {
  const audioFile = fs.readFileSync(filename);
  const audioBuffer = await decodeAudio(audioFile);
  const channelData = audioBuffer.getChannelData(0);
  const base64Chunk = base64EncodeAudio(channelData);

  ws.send(
    JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Chunk,
    })
  );
}

ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
ws.send(JSON.stringify({ type: 'response.create' }));
```

### Full Audio Messages

```javascript
const fullAudio = '<base64-encoded audio string>';

const event = {
  type: 'conversation.item.create',
  item: {
    type: 'message',
    role: 'user',
    content: [
      {
        type: 'input_audio',
        audio: fullAudio,
      },
    ],
  },
};

dataChannel.send(JSON.stringify(event));
```

### Processing Audio Output

```javascript
function handleEvent(e) {
  const serverEvent = JSON.parse(e.data);
  if (serverEvent.type === 'response.audio.delta') {
    // Access Base64-encoded audio chunks
    console.log(serverEvent.delta);
  }
}

ws.on('message', handleEvent);
```

## Voice Activity Detection (VAD)

### Default Behavior

- VAD is enabled by default
- API automatically detects when user starts/stops speaking
- Responds automatically

### Disabling VAD

```javascript
const event = {
  type: 'session.update',
  session: {
    turn_detection: null,
  },
};
```

**When VAD is disabled, manually:**

1. Send `input_audio_buffer.commit` to create user input
2. Send `response.create` to trigger response
3. Send `input_audio_buffer.clear` before new input

### Keep VAD, Disable Auto-Response

```javascript
const event = {
  type: 'session.update',
  session: {
    turn_detection: {
      interrupt_response: false,
      create_response: false,
    },
  },
};
```

## Advanced Response Handling

### Out-of-Band Responses

Generate responses outside the default conversation:

```javascript
const event = {
  type: 'response.create',
  response: {
    conversation: 'none', // Not added to default conversation
    metadata: { topic: 'classification' },
    modalities: ['text'],
    instructions: 'Analyze the conversation so far...',
  },
};

dataChannel.send(JSON.stringify(event));
```

### Custom Context Responses

```javascript
const event = {
  type: 'response.create',
  response: {
    conversation: 'none',
    metadata: { topic: 'pizza' },
    modalities: ['text'],
    input: [
      {
        type: 'item_reference',
        id: 'some_conversation_item_id',
      },
      {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'Is it okay to put pineapple on pizza?',
          },
        ],
      },
    ],
  },
};

dataChannel.send(JSON.stringify(event));
```

### No-Context Responses

```javascript
const event = {
  type: 'response.create',
  response: {
    input: [], // Empty array removes existing context
    instructions: "Say exactly the following: I'm a little teapot...",
  },
};

dataChannel.send(JSON.stringify(event));
```

## Function Calling

### Configure Functions

```javascript
{
  "type": "session.update",
  "session": {
    "tools": [
      {
        "type": "function",
        "name": "generate_horoscope",
        "description": "Give today's horoscope for an astrological sign.",
        "parameters": {
          "type": "object",
          "properties": {
            "sign": {
              "type": "string",
              "description": "The sign for the horoscope.",
              "enum": [
                "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
                "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
              ]
            }
          },
          "required": ["sign"]
        }
      }
    ],
    "tool_choice": "auto"
  }
}
```

### Function Call Detection

When the model wants to call a function, it returns:

```javascript
{
  "type": "response.done",
  "response": {
    "output": [
      {
        "type": "function_call",
        "name": "generate_horoscope",
        "call_id": "call_sHlR7iaFwQ2YQOqm",
        "arguments": "{\"sign\":\"Aquarius\"}"
      }
    ]
  }
}
```

### Provide Function Results

```javascript
{
  "type": "conversation.item.create",
  "item": {
    "type": "function_call_output",
    "call_id": "call_sHlR7iaFwQ2YQOqm",
    "output": "{\"horoscope\": \"You will soon meet a new friend.\"}"
  }
}
```

## Error Handling

Use `event_id` to track client events that cause errors:

```javascript
const event = {
  event_id: 'my_awesome_event',
  type: 'scooby.dooby.doo', // Invalid event type
};

dataChannel.send(JSON.stringify(event));
```

Error response:

```javascript
{
  "type": "invalid_request_error",
  "code": "invalid_value",
  "message": "Invalid value: 'scooby.dooby.doo' ...",
  "param": "type",
  "event_id": "my_awesome_event"
}
```

## Audio Format Configuration

### Session-level Configuration

```javascript
{
  "type": "session.update",
  "session": {
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16"
  }
}
```

### Response-level Configuration

```javascript
{
  "type": "response.create",
  "response": {
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16"
  }
}
```

## Best Practices

1. **Use WebRTC for client applications** - More robust for uncertain network conditions
2. **Use WebSockets for server-to-server** - Better for programmatic audio handling
3. **Handle audio chunks properly** - Maximum 15MB per chunk
4. **Track function calls** - Use `call_id` to match responses
5. **Implement error handling** - Use `event_id` for debugging
6. **Consider VAD settings** - Choose based on your interface needs

## Resources

- [WebRTC Samples Repository](https://github.com/openai/openai-realtime-samples)
- [Live WebRTC Demos](https://openai.com/realtime)
- [Voice Activity Detection Guide](https://platform.openai.com/docs/guides/realtime-voice-activity-detection)
