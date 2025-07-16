# OpenAI Realtime API - Server Events Reference

## Overview

This document provides a comprehensive reference for all server events sent by the OpenAI Realtime API. These events are received by your client application and indicate various states and updates during a realtime session.

## Event Categories

- [Session Events](#session-events)
- [Conversation Events](#conversation-events)
- [Response Events](#response-events)
- [Audio Events](#audio-events)
- [Text Events](#text-events)
- [Function Call Events](#function-call-events)
- [Input Audio Buffer Events](#input-audio-buffer-events)
- [Rate Limit Events](#rate-limit-events)
- [Error Events](#error-events)

---

## Session Events

### `session.created`

Emitted when a new session is successfully created.

```javascript
{
  "type": "session.created",
  "event_id": "event_123",
  "session": {
    "id": "sess_001",
    "object": "realtime.session",
    "model": "gpt-4o-realtime-preview-2024-12-17",
    "expires_at": 1234567890,
    "modalities": ["text", "audio"],
    "instructions": "You are a helpful assistant.",
    "voice": "alloy",
    "input_audio_format": "pcm16",
    "output_audio_format": "pcm16",
    "input_audio_transcription": null,
    "turn_detection": {
      "type": "server_vad",
      "threshold": 0.5,
      "prefix_padding_ms": 300,
      "silence_duration_ms": 500
    },
    "tools": [],
    "tool_choice": "auto",
    "temperature": 0.8,
    "max_response_output_tokens": 4096
  }
}
```

### `session.updated`

Emitted when session configuration is updated via `session.update`.

```javascript
{
  "type": "session.updated",
  "event_id": "event_124",
  "session": {
    // Updated session object with new configuration
  }
}
```

---

## Conversation Events

### `conversation.item.created`

Emitted when a new conversation item is added.

```javascript
{
  "type": "conversation.item.created",
  "event_id": "event_125",
  "previous_item_id": "item_001",
  "item": {
    "id": "item_002",
    "object": "realtime.item",
    "type": "message",
    "status": "completed",
    "role": "user",
    "content": [
      {
        "type": "input_text",
        "text": "Hello, how are you?"
      }
    ]
  }
}
```

### `conversation.item.input_audio_transcription.completed`

Emitted when input audio transcription is completed.

```javascript
{
  "type": "conversation.item.input_audio_transcription.completed",
  "event_id": "event_126",
  "item_id": "item_003",
  "content_index": 0,
  "transcript": "Hello, how are you today?"
}
```

### `conversation.item.input_audio_transcription.failed`

Emitted when input audio transcription fails.

```javascript
{
  "type": "conversation.item.input_audio_transcription.failed",
  "event_id": "event_127",
  "item_id": "item_003",
  "content_index": 0,
  "error": {
    "type": "transcription_error",
    "code": "audio_unintelligible",
    "message": "The audio could not be transcribed"
  }
}
```

---

## Response Events

### `response.created`

Emitted when a new response is created.

```javascript
{
  "type": "response.created",
  "event_id": "event_128",
  "response": {
    "id": "resp_001",
    "object": "realtime.response",
    "status": "in_progress",
    "status_details": null,
    "output": [],
    "usage": null
  }
}
```

### `response.done`

Emitted when a response is completely finished.

```javascript
{
  "type": "response.done",
  "event_id": "event_129",
  "response": {
    "id": "resp_001",
    "object": "realtime.response",
    "status": "completed",
    "status_details": null,
    "output": [
      {
        "id": "item_004",
        "object": "realtime.item",
        "type": "message",
        "status": "completed",
        "role": "assistant",
        "content": [
          {
            "type": "text",
            "text": "Hello! I'm doing well, thank you for asking."
          }
        ]
      }
    ],
    "usage": {
      "total_tokens": 150,
      "input_tokens": 50,
      "output_tokens": 100,
      "input_token_details": {
        "text_tokens": 30,
        "audio_tokens": 20,
        "cached_tokens": 0,
        "cached_tokens_details": {
          "text_tokens": 0,
          "audio_tokens": 0
        }
      },
      "output_token_details": {
        "text_tokens": 100,
        "audio_tokens": 0
      }
    }
  }
}
```

### `response.output_item.added`

Emitted when a new output item is added to the response.

```javascript
{
  "type": "response.output_item.added",
  "event_id": "event_130",
  "response_id": "resp_001",
  "output_index": 0,
  "item": {
    "id": "item_004",
    "object": "realtime.item",
    "type": "message",
    "status": "in_progress",
    "role": "assistant",
    "content": []
  }
}
```

### `response.output_item.done`

Emitted when an output item is completed.

```javascript
{
  "type": "response.output_item.done",
  "event_id": "event_131",
  "response_id": "resp_001",
  "output_index": 0,
  "item": {
    "id": "item_004",
    "object": "realtime.item",
    "type": "message",
    "status": "completed",
    "role": "assistant",
    "content": [
      {
        "type": "text",
        "text": "Hello! I'm doing well, thank you for asking."
      }
    ]
  }
}
```

### `response.content_part.added`

Emitted when a new content part is added to an output item.

```javascript
{
  "type": "response.content_part.added",
  "event_id": "event_132",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "text",
    "text": ""
  }
}
```

### `response.content_part.done`

Emitted when a content part is completed.

```javascript
{
  "type": "response.content_part.done",
  "event_id": "event_133",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "text",
    "text": "Hello! I'm doing well, thank you for asking."
  }
}
```

---

## Audio Events

### `response.audio.delta`

Emitted when audio response data is available.

```javascript
{
  "type": "response.audio.delta",
  "event_id": "event_134",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "delta": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAA..."
}
```

### `response.audio.done`

Emitted when audio response is completed.

```javascript
{
  "type": "response.audio.done",
  "event_id": "event_135",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0
}
```

### `response.audio_transcript.delta`

Emitted when audio transcript data is available.

```javascript
{
  "type": "response.audio_transcript.delta",
  "event_id": "event_136",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "delta": "Hello! I'm"
}
```

### `response.audio_transcript.done`

Emitted when audio transcript is completed.

```javascript
{
  "type": "response.audio_transcript.done",
  "event_id": "event_137",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "transcript": "Hello! I'm doing well, thank you for asking."
}
```

---

## Text Events

### `response.text.delta`

Emitted when text response data is available.

```javascript
{
  "type": "response.text.delta",
  "event_id": "event_138",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "delta": "Hello! I'm"
}
```

### `response.text.done`

Emitted when text response is completed.

```javascript
{
  "type": "response.text.done",
  "event_id": "event_139",
  "response_id": "resp_001",
  "item_id": "item_004",
  "output_index": 0,
  "content_index": 0,
  "text": "Hello! I'm doing well, thank you for asking."
}
```

---

## Function Call Events

### `response.function_call_arguments.delta`

Emitted when function call argument data is available.

```javascript
{
  "type": "response.function_call_arguments.delta",
  "event_id": "event_140",
  "response_id": "resp_002",
  "item_id": "item_005",
  "output_index": 0,
  "call_id": "call_001",
  "delta": "{\"sign\":"
}
```

### `response.function_call_arguments.done`

Emitted when function call arguments are completed.

```javascript
{
  "type": "response.function_call_arguments.done",
  "event_id": "event_141",
  "response_id": "resp_002",
  "item_id": "item_005",
  "output_index": 0,
  "call_id": "call_001",
  "arguments": "{\"sign\":\"Aquarius\"}"
}
```

---

## Input Audio Buffer Events

### `input_audio_buffer.committed`

Emitted when the input audio buffer is committed.

```javascript
{
  "type": "input_audio_buffer.committed",
  "event_id": "event_142",
  "previous_item_id": "item_005",
  "item_id": "item_006"
}
```

### `input_audio_buffer.cleared`

Emitted when the input audio buffer is cleared.

```javascript
{
  "type": "input_audio_buffer.cleared",
  "event_id": "event_143"
}
```

### `input_audio_buffer.speech_started`

Emitted when speech is detected in the input audio buffer.

```javascript
{
  "type": "input_audio_buffer.speech_started",
  "event_id": "event_144",
  "audio_start_ms": 1000
}
```

### `input_audio_buffer.speech_stopped`

Emitted when speech stops in the input audio buffer.

```javascript
{
  "type": "input_audio_buffer.speech_stopped",
  "event_id": "event_145",
  "audio_end_ms": 3000,
  "item_id": "item_007"
}
```

---

## Rate Limit Events

### `rate_limits.updated`

Emitted when rate limits are updated.

```javascript
{
  "type": "rate_limits.updated",
  "event_id": "event_146",
  "rate_limits": [
    {
      "name": "requests",
      "limit": 1000,
      "remaining": 999,
      "reset_seconds": 60
    },
    {
      "name": "tokens",
      "limit": 150000,
      "remaining": 149500,
      "reset_seconds": 60
    }
  ]
}
```

---

## Error Events

### `error`

Emitted when an error occurs during the session.

```javascript
{
  "type": "error",
  "event_id": "event_147",
  "error": {
    "type": "invalid_request_error",
    "code": "invalid_value",
    "message": "Invalid value: 'invalid_event_type' for parameter 'type'",
    "param": "type",
    "event_id": "client_event_123"
  }
}
```

### Common Error Types

| Error Type                   | Description                 |
| ---------------------------- | --------------------------- |
| `invalid_request_error`      | Request format is invalid   |
| `authentication_error`       | Authentication failed       |
| `permission_error`           | Insufficient permissions    |
| `not_found_error`            | Resource not found          |
| `unprocessable_entity_error` | Request cannot be processed |
| `rate_limit_error`           | Rate limit exceeded         |
| `internal_error`             | Internal server error       |

---

## Event Handling Patterns

### Basic Event Handler

```javascript
function handleServerEvent(event) {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'session.created':
      console.log('Session created:', data.session.id);
      break;

    case 'response.text.delta':
      // Append text delta to UI
      appendTextToResponse(data.delta);
      break;

    case 'response.audio.delta':
      // Play audio delta
      playAudioChunk(data.delta);
      break;

    case 'response.done':
      console.log('Response completed:', data.response);
      break;

    case 'error':
      console.error('Error:', data.error);
      break;

    default:
      console.log('Unhandled event:', data.type);
  }
}

// WebSocket
ws.on('message', handleServerEvent);

// WebRTC Data Channel
dataChannel.addEventListener('message', handleServerEvent);
```

### Function Call Handler

```javascript
function handleFunctionCall(event) {
  const data = JSON.parse(event.data);

  if (data.type === 'response.done') {
    const output = data.response.output[0];

    if (output.type === 'function_call') {
      const { name, call_id, arguments: args } = output;

      // Execute the function
      const result = executeFunction(name, JSON.parse(args));

      // Send result back to API
      const resultEvent = {
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: call_id,
          output: JSON.stringify(result),
        },
      };

      ws.send(JSON.stringify(resultEvent));

      // Request new response
      ws.send(JSON.stringify({ type: 'response.create' }));
    }
  }
}
```

### Audio Stream Handler

```javascript
class AudioStreamHandler {
  constructor() {
    this.audioChunks = [];
    this.isPlaying = false;
  }

  handleAudioDelta(data) {
    if (data.type === 'response.audio.delta') {
      this.audioChunks.push(data.delta);

      if (!this.isPlaying) {
        this.playAudioStream();
      }
    }
  }

  async playAudioStream() {
    this.isPlaying = true;

    while (this.audioChunks.length > 0) {
      const chunk = this.audioChunks.shift();
      await this.playChunk(chunk);
    }

    this.isPlaying = false;
  }

  async playChunk(base64Audio) {
    // Decode and play audio chunk
    const audioData = this.base64ToArrayBuffer(base64Audio);
    // ... implement audio playback logic
  }
}
```

---

## Event Lifecycle Summary

| Event Flow           | Events                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Session Start**    | `session.created` → `session.updated`                                                                                                                                                                                                                                                      |
| **Text Generation**  | `response.created` → `response.output_item.added` → `response.content_part.added` → `response.text.delta`\* → `response.text.done` → `response.content_part.done` → `response.output_item.done` → `response.done`                                                                          |
| **Audio Generation** | `response.created` → `response.output_item.added` → `response.content_part.added` → `response.audio.delta`_ → `response.audio_transcript.delta`_ → `response.audio.done` → `response.audio_transcript.done` → `response.content_part.done` → `response.output_item.done` → `response.done` |
| **Function Calling** | `response.created` → `response.output_item.added` → `response.function_call_arguments.delta`\* → `response.function_call_arguments.done` → `response.output_item.done` → `response.done`                                                                                                   |
| **Audio Input**      | `input_audio_buffer.speech_started` → `input_audio_buffer.speech_stopped` → `input_audio_buffer.committed` → `conversation.item.created`                                                                                                                                                   |

_\* These events may occur multiple times during the process_
