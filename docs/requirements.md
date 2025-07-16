# Smriti Demo - Technical Product Requirements Document

## Executive Summary

This document outlines the technical requirements for building a demonstration of the Smriti spiritual guidance platform. The demo will showcase core conversational AI capabilities using OpenAI's GPT-4 and TTS models, featuring both text and voice interactions through a modern web interface.

## 1. Project Overview

### 1.1 Demo Objectives

- Demonstrate Smriti's conversational AI capabilities for spiritual guidance
- Showcase seamless text and voice interaction modes
- Validate technical architecture for MVP development
- Create a compelling proof-of-concept for investors and stakeholders

### 1.2 Technology Stack

- **Monorepo Management**: NX
- **Frontend**: Next.js 14+ (App Router)
- **Authentication**: Clerk
- **WebSocket Server**: Node.js with OpenAI Realtime API
- **AI Models**: OpenAI GPT-4 & TTS
- **Deployment**: Vercel (Frontend) + Railway/Render (WS Server)

### 1.3 Demo Scope

- User authentication via Clerk
- Text-based chat interface
- Voice conversation capabilities
- Basic spiritual guidance responses
- Simple, clean UI demonstrating core functionality

## 2. Architecture Design

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        NX Monorepo                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐     ┌──────────────────────┐     │
│  │   Next.js App       │     │   WebSocket Server   │     │
│  │                     │     │                      │     │
│  │  - Chat UI         │     │  - OpenAI Realtime   │     │
│  │  - Voice Interface │ <--> │    API Integration   │     │
│  │  - Clerk Auth      │ WS  │  - Audio Processing  │     │
│  │  - API Routes      │     │  - Session Management│     │
│  └─────────────────────┘     └──────────────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │              Shared Libraries                    │      │
│  │  - Types/Interfaces                             │      │
│  │  - Utilities                                    │      │
│  │  - Constants                                    │      │
│  └─────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
User → Next.js Frontend → WebSocket Connection → WS Server → OpenAI Realtime API
                ↑                                     ↓
                └─────────── Response ←───────────────┘
```

## 3. Detailed Technical Requirements

### 3.1 NX Monorepo Setup

#### 3.1.1 Initial Setup

```bash
# Create NX workspace
npx create-nx-workspace@latest smriti-demo --preset=empty --nx-cloud=false

# Install NX plugins
npm install -D @nx/next @nx/node @nx/js @nx/eslint-plugin @nx/jest
```

#### 3.1.2 Project Structure

```
smriti-demo/
├── apps/
│   ├── web/                    # Next.js application
│   └── ws-server/              # WebSocket server
├── packages/
│   ├── shared/
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Shared utilities
│   │   └── constants/         # Shared constants
│   └── ui/                    # Shared UI components
├── tools/
├── nx.json
├── package.json
└── tsconfig.base.json
```

#### 3.1.3 NX Configuration

- Configure shared TypeScript paths in `tsconfig.base.json`
- Set up workspace generators for consistent code structure
- Configure environment variables for both apps
- Set up build dependencies between projects

### 3.2 Frontend Application (Next.js)

#### 3.2.1 Project Setup

```bash
# Generate Next.js app
nx g @nx/next:app web --style=tailwind --appDir=true

# Install required dependencies
npm install @clerk/nextjs @tanstack/react-query lucide-react
npm install -D @types/node
```

#### 3.2.2 Application Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Protected layout with Clerk
│   │   └── chat/
│   │       └── page.tsx        # Main chat interface
│   ├── api/
│   │   └── ws-token/
│   │       └── route.ts        # Generate WS auth token
│   ├── layout.tsx              # Root layout with providers
│   └── page.tsx                # Landing/redirect page
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx   # Main chat component
│   │   ├── MessageList.tsx     # Message display
│   │   ├── MessageInput.tsx    # Text input
│   │   └── VoiceButton.tsx     # Voice interaction
│   ├── layout/
│   │   ├── Header.tsx          # Top toolbar with profile
│   │   └── UserProfile.tsx     # Clerk user button
│   └── providers/
│       ├── ClerkProvider.tsx
│       └── QueryProvider.tsx
├── hooks/
│   ├── useWebSocket.ts         # WS connection management
│   ├── useAudioRecorder.ts     # Audio recording logic
│   └── useChat.ts              # Chat state management
├── lib/
│   ├── websocket.ts            # WS client implementation
│   └── audio.ts                # Audio utilities
└── styles/
    └── globals.css             # Tailwind styles
```

#### 3.2.3 Key Components Implementation

**ClerkProvider Setup**

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

**Protected Route Layout**

```typescript
// app/(dashboard)/layout.tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({ children }) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
}
```

**Chat Interface Component Structure**

```typescript
// components/chat/ChatInterface.tsx
interface ChatInterfaceProps {
  userId: string;
}

export function ChatInterface({ userId }: ChatInterfaceProps) {
  // Initialize WebSocket connection
  // Manage chat state
  // Handle text/voice inputs
  // Render message list and input controls
}
```

**WebSocket Hook**

```typescript
// hooks/useWebSocket.ts
interface UseWebSocketOptions {
  url: string;
  token: string;
  onMessage: (message: any) => void;
  onError: (error: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions) {
  // Establish WS connection
  // Handle reconnection logic
  // Manage connection state
  // Return send function and connection status
}
```

**Audio Recorder Hook**

```typescript
// hooks/useAudioRecorder.ts
export function useAudioRecorder() {
  // Initialize MediaRecorder
  // Handle start/stop recording
  // Convert audio to appropriate format
  // Return recording state and controls
}
```

#### 3.2.4 UI/UX Requirements

**Design System**

- Use Tailwind CSS with custom theme matching Smriti brand colors
- Implement responsive design for mobile/desktop
- Follow accessibility guidelines (WCAG 2.1 AA)

**Chat Interface Layout**

```
┌─────────────────────────────────────┐
│  Header (Logo | User Profile)       │
├─────────────────────────────────────┤
│                                     │
│     Message List                    │
│     - User messages (right)         │
│     - AI responses (left)           │
│     - Typing indicators             │
│     - Audio playback controls       │
│                                     │
├─────────────────────────────────────┤
│  Input Area                         │
│  [Text Input]  [🎤] [Send]         │
└─────────────────────────────────────┘
```

**Voice Interaction States**

- Idle: Microphone icon
- Recording: Animated recording indicator
- Processing: Loading spinner
- Playing: Audio waveform visualization

### 3.3 WebSocket Server

#### 3.3.1 Project Setup

```bash
# Generate Node.js app
nx g @nx/node:app ws-server

# Install dependencies
npm install ws openai dotenv cors express
npm install -D @types/ws @types/express nodemon
```

#### 3.3.2 Server Structure

```
apps/ws-server/
├── src/
│   ├── main.ts                 # Server entry point
│   ├── config/
│   │   └── openai.ts          # OpenAI configuration
│   ├── handlers/
│   │   ├── connection.ts      # WS connection handler
│   │   ├── message.ts         # Message processing
│   │   └── audio.ts           # Audio handling
│   ├── services/
│   │   ├── openai-realtime.ts # OpenAI Realtime API
│   │   ├── session.ts         # Session management
│   │   └── auth.ts            # Token validation
│   ├── utils/
│   │   ├── audio.ts           # Audio processing
│   │   └── logger.ts          # Logging utility
│   └── types/
│       └── index.ts           # Server-specific types
├── .env.example
└── project.json
```

#### 3.3.3 Core Implementation Details

**Server Initialization**

```typescript
// main.ts
import { WebSocketServer } from 'ws';
import express from 'express';
import { handleConnection } from './handlers/connection';

const app = express();
const server = app.listen(process.env.PORT || 8080);
const wss = new WebSocketServer({ server });

wss.on('connection', handleConnection);
```

**OpenAI Realtime Integration**

```typescript
// services/openai-realtime.ts
class OpenAIRealtimeService {
  private client: WebSocket;

  async initialize(sessionId: string) {
    // Connect to OpenAI Realtime API
    // Configure session parameters
    // Set up event handlers
  }

  async sendAudio(audioData: Buffer) {
    // Process and send audio to OpenAI
  }

  async sendText(text: string) {
    // Send text message to OpenAI
  }

  handleResponse(callback: (response: any) => void) {
    // Process OpenAI responses
    // Handle both text and audio responses
  }
}
```

**Connection Handler**

```typescript
// handlers/connection.ts
export async function handleConnection(ws: WebSocket, req: Request) {
  // Validate authentication token
  // Create session
  // Initialize OpenAI connection
  // Set up message handlers
  // Handle disconnection cleanup
}
```

**Message Protocol**

```typescript
// WebSocket message types
interface WSMessage {
  type: 'text' | 'audio' | 'control'
  payload: any
  timestamp: number
  sessionId: string
}

// Text message
{
  type: 'text',
  payload: {
    content: string,
    messageId: string
  }
}

// Audio message
{
  type: 'audio',
  payload: {
    audioData: string, // base64 encoded
    format: 'pcm' | 'mp3',
    sampleRate: number
  }
}

// Control message
{
  type: 'control',
  payload: {
    action: 'start_recording' | 'stop_recording' | 'end_session'
  }
}
```

#### 3.3.4 Session Management

```typescript
// services/session.ts
class SessionManager {
  private sessions: Map<string, Session>;

  createSession(userId: string, wsConnection: WebSocket) {
    // Create new session
    // Initialize OpenAI connection
    // Store session data
  }

  getSession(sessionId: string) {
    // Retrieve active session
  }

  endSession(sessionId: string) {
    // Clean up resources
    // Close connections
  }
}
```

### 3.4 Shared Libraries

#### 3.4.1 Types Library

```bash
nx g @nx/js:lib shared/types
```

```typescript
// libs/shared/types/src/index.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Message {
  id: string;
  content: string;
  type: 'text' | 'audio';
  sender: 'user' | 'ai';
  timestamp: Date;
  audioUrl?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.4.2 Utils Library

```bash
nx g @nx/js:lib shared/utils
```

```typescript
// libs/shared/utils/src/index.ts
export function generateMessageId(): string;
export function formatTimestamp(date: Date): string;
export function validateAudioFormat(data: ArrayBuffer): boolean;
export function encodeAudioData(buffer: ArrayBuffer): string;
export function decodeAudioData(encoded: string): ArrayBuffer;
```

#### 3.4.3 Constants Library

```bash
nx g @nx/js:lib shared/constants
```

```typescript
// libs/shared/constants/src/index.ts
export const WS_EVENTS = {
  CONNECTION: 'connection',
  MESSAGE: 'message',
  ERROR: 'error',
  CLOSE: 'close',
};

export const AUDIO_CONFIG = {
  SAMPLE_RATE: 24000,
  CHANNELS: 1,
  FORMAT: 'pcm',
};

export const API_ENDPOINTS = {
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080',
};
```

## 4. Environment Configuration

### 4.1 Frontend Environment Variables

```env
# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/chat
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

### 4.2 WebSocket Server Environment Variables

```env
# apps/ws-server/.env
PORT=8080
OPENAI_API_KEY=sk-...
CLERK_SECRET_KEY=sk_test_...
NODE_ENV=development
```

## 5. Implementation Phases

### 5.1 Phase 1: Foundation (Days 1-3)

1. **Day 1**: NX monorepo setup and project generation

   - Initialize NX workspace
   - Generate Next.js and Node.js applications
   - Set up shared libraries
   - Configure TypeScript paths

2. **Day 2**: Authentication implementation

   - Integrate Clerk in Next.js
   - Create sign-in/sign-up pages
   - Implement protected routes
   - Add user profile component

3. **Day 3**: Basic UI components
   - Create chat interface layout
   - Build message components
   - Implement input controls
   - Add responsive design

### 5.2 Phase 2: Core Features (Days 4-7)

4. **Day 4**: WebSocket server foundation

   - Set up Express + WS server
   - Implement connection handling
   - Add authentication validation
   - Create session management

5. **Day 5**: OpenAI integration

   - Integrate OpenAI Realtime API
   - Implement text message handling
   - Add response streaming
   - Handle error cases

6. **Day 6**: Audio functionality

   - Implement audio recording in frontend
   - Add audio processing in server
   - Integrate with OpenAI audio
   - Build playback controls

7. **Day 7**: Integration testing
   - Connect frontend to WS server
   - Test text conversations
   - Test audio conversations
   - Fix integration issues

### 5.3 Phase 3: Polish & Deployment (Days 8-10)

8. **Day 8**: UI/UX improvements

   - Add loading states
   - Implement error handling
   - Add animations
   - Improve mobile experience

9. **Day 9**: Performance optimization

   - Optimize WebSocket reconnection
   - Add message caching
   - Implement lazy loading
   - Minimize bundle size

10. **Day 10**: Deployment
    - Deploy Next.js to Vercel
    - Deploy WS server to Railway/Render
    - Configure production environment
    - Final testing and documentation

## 6. Testing Strategy

### 6.1 Unit Testing

```bash
# Configure Jest for both apps
nx g @nx/jest:configuration --project=web
nx g @nx/jest:configuration --project=ws-server
```

**Test Coverage Requirements**

- Frontend components: 80%
- WebSocket handlers: 90%
- Shared utilities: 100%

### 6.2 Integration Testing

- Test Clerk authentication flow
- Test WebSocket connection establishment
- Test message exchange (text and audio)
- Test error scenarios and recovery

### 6.3 E2E Testing

```bash
# Add Cypress for E2E testing
nx g @nx/cypress:configuration --project=web-e2e
```

**E2E Test Scenarios**

- Complete user journey from sign-up to chat
- Text conversation flow
- Voice conversation flow
- Session persistence across refreshes

## 7. Performance Requirements

### 7.1 Frontend Performance

- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- Message send/receive latency: < 500ms
- Audio recording start: < 200ms

### 7.2 WebSocket Server Performance

- Connection establishment: < 1 second
- Message processing: < 100ms
- Audio processing latency: < 500ms
- Concurrent connections: 100+ users

### 7.3 Optimization Strategies

- Implement message pagination
- Use React.memo for message components
- Implement virtual scrolling for long conversations
- Cache audio responses
- Use CDN for static assets

## 8. Security Considerations

### 8.1 Authentication & Authorization

- Validate Clerk tokens on WS connection
- Implement rate limiting per user
- Secure session management
- Token refresh mechanism

### 8.2 Data Protection

- Encrypt messages in transit (WSS)
- Sanitize user inputs
- Implement CORS properly
- Secure environment variables

### 8.3 Content Moderation

- Basic profanity filtering
- Implement request throttling
- Log suspicious activities
- Emergency session termination

## 9. Monitoring & Analytics

### 9.1 Application Monitoring

- Error tracking (Sentry)
- Performance monitoring
- User session analytics
- API usage tracking

### 9.2 Key Metrics to Track

- User engagement (messages per session)
- Voice vs text usage ratio
- Session duration
- Error rates
- Response times

## 10. Documentation Requirements

### 10.1 Technical Documentation

- API documentation for WS protocol
- Component library documentation
- Deployment guide
- Environment setup guide

### 10.2 User Documentation

- Demo usage guide
- Feature walkthrough
- Troubleshooting guide
- FAQ section

## 11. Demo-Specific Features

### 11.1 Preset Spiritual Contexts

Since this is a demo, implement preset prompts that showcase Smriti's capabilities:

```typescript
const DEMO_CONTEXTS = {
  general: 'You are Smriti, a compassionate spiritual guide...',
  festival: 'User is asking about Hindu festivals...',
  philosophy: 'User seeks understanding of Vedantic concepts...',
  daily_practice: 'User wants guidance on daily spiritual practices...',
};
```

### 11.2 Demo Limitations

- Limit conversation history to last 20 messages
- Session timeout after 30 minutes
- Basic error messages (not production-ready)
- Limited to English language

### 11.3 Showcase Features

- Quick response suggestions for common queries
- Visual indicators for AI thinking/speaking
- Smooth transitions between text and voice
- Sample spiritual guidance responses

## 12. Success Criteria

### 12.1 Functional Requirements

- ✓ User can sign up/sign in via Clerk
- ✓ User can send text messages to AI
- ✓ User can have voice conversations
- ✓ AI provides contextual spiritual guidance
- ✓ Conversation history is maintained during session

### 12.2 Technical Requirements

- ✓ NX monorepo properly configured
- ✓ WebSocket connection stable
- ✓ OpenAI Realtime API integrated
- ✓ Audio recording/playback functional
- ✓ Deployment successful

### 12.3 User Experience Requirements

- ✓ Intuitive chat interface
- ✓ Smooth voice interaction
- ✓ Quick response times
- ✓ Mobile-friendly design
- ✓ Clear error messages

## 13. Handoff Deliverables

### 13.1 Code Deliverables

- Complete NX monorepo with all code
- Environment configuration templates
- Deployment configuration files
- Test suites

### 13.2 Documentation Deliverables

- Setup and installation guide
- API documentation
- Architecture diagrams
- Demo script for stakeholders

### 13.3 Deployment Deliverables

- Live demo URL
- Admin access credentials
- Monitoring dashboard access
- Cost analysis report

---

This technical requirements document provides a comprehensive blueprint for building the Smriti demo. The modular architecture and phased approach ensure systematic development while maintaining flexibility for iterations based on feedback.
