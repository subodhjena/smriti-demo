# Smriti Web Application

A Next.js web application for the Smriti spiritual guidance platform featuring real-time WebSocket communication and OpenAI Realtime API integration for intelligent conversations.

## 🌟 Overview

Smriti Web is the frontend application of the Smriti spiritual guidance platform. It provides a beautiful, responsive chat interface with real-time text messaging capabilities powered by OpenAI's Realtime API.

## 🚀 Current Features

### Core Features ✅

- **Real-time Chat**: WebSocket-powered chat with OpenAI Realtime API
- **Streaming Responses**: Character-by-character AI response display
- **Connection Management**: Robust WebSocket connection with auto-reconnection
- **Authentication**: Secure user authentication powered by Clerk
- **Responsive Design**: Beautiful, mobile-first design with Tailwind CSS and DaisyUI
- **TypeScript**: Full TypeScript support with comprehensive type safety
- **Performance**: Optimized components with React.memo and proper callback usage

### WebSocket Integration ✅

- **Stable Connection**: Auto-connecting WebSocket with exponential backoff reconnection
- **Event Handling**: Comprehensive OpenAI Realtime API event processing
- **Error Recovery**: Graceful error handling with user feedback
- **Status Monitoring**: Real-time connection status indicators in header
- **Message Validation**: Input validation and length limits

### User Experience ✅

- **Beautiful Interface**: Spiritual-themed UI with gradient backgrounds
- **Message Status**: Real-time status tracking (sending, sent, receiving, completed, error)
- **Loading States**: Comprehensive loading indicators and status banners
- **Error Handling**: User-friendly error messages and recovery options
- **Accessibility**: Screen reader support and keyboard navigation

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 15.2.4 with React 19
- **Authentication**: Clerk Next.js integration
- **Styling**: Tailwind CSS 4.x with daisyUI components
- **WebSockets**: Custom useWebSocket hook with reconnection logic
- **AI Integration**: OpenAI Realtime API via WebSocket server
- **TypeScript**: Full TypeScript support with JSDoc documentation
- **Build Tool**: Nx monorepo with SWC for fast compilation
- **Package Manager**: pnpm with workspace support

### Project Structure

```plaintext
apps/web/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes
│   │   └── hello/             # Example API endpoint
│   ├── layout.tsx             # Root layout with Clerk provider
│   ├── page.tsx              # Chat interface home page
│   └── global.css            # Global styles (Tailwind + daisyUI)
├── components/                # React components
│   └── chat/                  # Chat-specific components
│       ├── ChatInterface.tsx  # Main chat orchestrator
│       ├── Header.tsx        # App header with connection status
│       ├── MessageBubble.tsx # Individual message display
│       ├── MessageList.tsx   # Message container with auto-scroll
│       ├── MessageInput.tsx  # Text input with send functionality
│       ├── ConnectionStatus.tsx # WebSocket status indicator
│       ├── TypingIndicator.tsx # AI typing animation
│       └── VoiceButton.tsx   # Voice recording button (ready for audio)
├── hooks/                     # Custom React hooks
│   ├── useWebSocket.ts       # WebSocket connection management
│   └── useOpenAIMessages.ts  # OpenAI message flow and state
├── middleware.ts             # Clerk authentication middleware
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── postcss.config.mjs        # PostCSS configuration
├── eslint.config.mjs         # ESLint configuration
└── project.json              # Nx project configuration
```

### Authentication Flow

The application uses Clerk middleware for automatic authentication:

- **Protected Routes**: All routes require authentication
- **Automatic Redirect**: Unauthenticated users are redirected to Clerk's sign-in interface
- **Seamless Experience**: Authenticated users see the chat interface immediately

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- pnpm (package manager)
- Access to Smriti monorepo workspace

### Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```bash
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:4200
NODE_ENV=development
PORT=4200
```

### Installation

1. **Install dependencies** (from workspace root):

   ```bash
   pnpm install
   ```

2. **Development server**:

   ```bash
   # Start WebSocket server first (Terminal 1)
   npx nx serve ws-server

   # Start web application (Terminal 2)
   npx nx serve web
   ```

3. **Production build**:

   ```bash
   npx nx build web
   ```

### Clerk Authentication Setup

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Configure sign-in/sign-up options
3. Add your Clerk keys to `.env.local`
4. The application will automatically protect all routes

## 🔧 Configuration

### TypeScript Configuration

- Extends workspace base configuration
- Configured for Next.js with JSX preservation
- Path mapping for workspace packages (@smriti/\*)
- Strict type checking enabled with comprehensive interfaces

### WebSocket Integration

- **useWebSocket Hook**: Custom hook managing connection lifecycle
- **Auto-reconnection**: Exponential backoff strategy for connection failures
- **Event Handling**: OpenAI Realtime API event processing
- **Error Recovery**: Comprehensive error handling and user feedback

### Styling

- **Tailwind CSS 4.x**: Latest Tailwind configuration with spiritual theming
- **daisyUI**: Component library for consistent UI patterns
- **Custom Theme**: Gradient backgrounds and spiritual color palette
- **Responsive Design**: Mobile-first approach with breakpoint optimization

## 📦 Workspace Integration

This application is part of the Smriti monorepo and depends on:

- **`@smriti/types`**: Shared TypeScript interfaces for WebSocket messages and API types
- **`@smriti/constants`**: Application constants including WebSocket events and configuration
- **`@smriti/utils`**: Utility functions for message handling and validation

## 🚀 Development Workflow

### Current State

The application provides a complete real-time chat experience:

- ✅ **WebSocket Communication**: Stable, production-ready connection management
- ✅ **OpenAI Integration**: Full Realtime API integration with streaming responses
- ✅ **Authentication**: Seamless Clerk integration with protected routes
- ✅ **UI/UX**: Beautiful, responsive interface with comprehensive status feedback
- ✅ **Error Handling**: Robust error recovery and user feedback systems
- ✅ **Performance**: Optimized components with proper memoization
- 🚧 **Audio Features**: Voice recording and playback (ready for implementation)

### Development Commands

```bash
# Development server with hot reload
npx nx serve web

# Type checking
npx nx typecheck web

# Linting
npx nx lint web

# Testing
npx nx test web

# Production build
npx nx build web
```

## 🎯 Key Features Deep Dive

### WebSocket Hook (`useWebSocket`)

Advanced WebSocket management with:

- **Connection Lifecycle**: Automatic connection, reconnection, and cleanup
- **Error Handling**: Detailed error messages and recovery strategies
- **Event Processing**: OpenAI Realtime API event handling
- **Performance**: Optimized to prevent unnecessary re-renders

### OpenAI Messages Hook (`useOpenAIMessages`)

Comprehensive message state management:

- **Message Flow**: User input → WebSocket → OpenAI → streaming response
- **Status Tracking**: Real-time message status updates
- **Validation**: Input validation and error handling
- **Streaming**: Character-by-character response display

### Chat Interface Components

Modular, reusable components:

- **ChatInterface**: Main orchestrator component
- **Header**: Connection status and user profile
- **MessageBubble**: Individual message display with status indicators
- **MessageList**: Auto-scrolling message container
- **MessageInput**: Text input with send functionality and validation

## 🔍 Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**:

   - Ensure WebSocket server is running on port 3000
   - Check `NEXT_PUBLIC_WS_URL` environment variable
   - Verify firewall settings

2. **Authentication Issues**:

   - Check Clerk environment variables
   - Verify Clerk project configuration
   - Clear browser cache and localStorage

3. **Styling Issues**:

   - Ensure Tailwind CSS is properly imported in global.css
   - Verify daisyUI configuration
   - Check for CSS conflicts

4. **Performance Issues**:
   - Monitor network tab for WebSocket connection status
   - Check console for React warnings
   - Use React DevTools Profiler for component performance

### Development Tips

- Use `npx nx serve web` for development with hot reload
- Check browser console for WebSocket connection logs
- Monitor network tab for real-time message flow
- Use React DevTools for component debugging

## 📈 Performance Optimizations

### Implemented Optimizations

- **React.memo**: MessageBubble and ChatInterface components memoized
- **Callback Optimization**: useCallback for event handlers
- **Ref Usage**: Callback refs to prevent unnecessary re-renders
- **Connection Management**: Stable WebSocket connection without cycling

### Monitoring

- Development logging for WebSocket events
- Message status tracking for debugging
- Connection state monitoring in UI
- Error boundary implementation for graceful failures

## 🔮 Future Enhancements

### Audio Features (Next Phase)

- **Voice Recording**: MediaRecorder API integration
- **Audio Streaming**: Real-time audio transmission via WebSocket
- **Audio Playback**: Web Audio API for high-quality playback
- **Voice Controls**: Push-to-talk and continuous recording modes

### Advanced Features

- **Message History**: Conversation persistence across sessions
- **Audio Transcription**: Real-time speech-to-text display
- **Enhanced UI**: Audio visualizations and advanced controls
- **Performance**: Additional optimizations for large conversations

---

**Ready for Production**: The current implementation provides a robust, production-ready text chat experience with OpenAI Realtime API integration. Audio features are architected and ready for implementation in the next development phase.
