# Smriti Demo - Spiritual Guidance Platform

A demonstration of the Smriti spiritual guidance platform featuring conversational AI capabilities with real-time text messaging and WebSocket communication. Built with NX monorepo architecture using Next.js and Node.js with OpenAI Realtime API integration.

## 🏗️ Project Architecture

This project uses NX monorepo to manage multiple applications and shared libraries:

```
smriti/
├── apps/
│   ├── web/                    # Next.js frontend application
│   └── ws-server/              # Node.js WebSocket server
├── packages/
│   └── shared/
│       ├── types/             # Shared TypeScript interfaces
│       ├── utils/             # Shared utility functions
│       ├── constants/         # Shared constants
│       └── logger/            # Structured logging with Pino
├── docs/                      # Documentation
└── debug/                     # Development debugging tools
```

## 🚀 Technology Stack

- **Monorepo**: NX 21.2.3
- **Frontend**: Next.js 15+ (App Router)
- **Backend**: Node.js + Express + WebSocket
- **Authentication**: Clerk (fully integrated)
- **AI Integration**: OpenAI GPT-4 Realtime API
- **Styling**: Tailwind CSS + DaisyUI
- **Language**: TypeScript
- **Package Manager**: pnpm

## ✅ Current Implementation Status

### Core Infrastructure ✅

- ✅ **NX Monorepo**: Fully configured with shared libraries and workspace dependencies
- ✅ **Shared Libraries**: Types, constants, utilities, and structured logging implemented
- ✅ **Authentication**: Clerk integration with protected routes working perfectly
- ✅ **Development Setup**: Port configuration resolved (WebSocket: 3000, Web: 4200)
- ✅ **Code Quality**: TypeScript with comprehensive interfaces and JSDoc documentation

### WebSocket & Real-time Communication ✅

- ✅ **WebSocket Server**: Complete OpenAI Realtime API integration with robust error handling
- ✅ **WebSocket Client**: Production-ready hook with auto-reconnection and exponential backoff
- ✅ **Connection Management**: Stable connection without cycling, intelligent reconnection logic
- ✅ **Event Processing**: Comprehensive OpenAI Realtime API event handling
- ✅ **Error Recovery**: Graceful error handling with user feedback and recovery mechanisms

### Text Messaging System ✅

- ✅ **Real-time Chat**: Complete text messaging with OpenAI Realtime API integration
- ✅ **Streaming Responses**: Character-by-character AI response display
- ✅ **Message Status**: Real-time status tracking (sending, sent, receiving, completed, error)
- ✅ **Input Validation**: Message length limits and validation with user feedback
- ✅ **Spiritual Context**: AI responses with proper spiritual guidance context

### User Interface ✅

- ✅ **Beautiful Design**: Spiritual-themed UI with gradient backgrounds and modern components
- ✅ **Responsive Layout**: Mobile-first design that works perfectly on all screen sizes
- ✅ **Connection Status**: Visual indicators for WebSocket connection state in header
- ✅ **Loading States**: Comprehensive loading indicators and status banners
- ✅ **Accessibility**: Screen reader support and keyboard navigation
- ✅ **Performance**: Memoized components and optimized re-render patterns

### Production Readiness ✅

- ✅ **Error Handling**: Comprehensive error boundaries and recovery mechanisms
- ✅ **Type Safety**: Full TypeScript coverage with detailed interfaces
- ✅ **Documentation**: Complete JSDoc documentation for hooks and components
- ✅ **Code Quality**: Clean architecture with separation of concerns
- ✅ **Testing Ready**: Architecture supports comprehensive testing implementation

## 🌟 Current Features

### Real-time Text Messaging ✅

- **WebSocket Communication**: Stable, production-ready WebSocket connection
- **OpenAI Realtime API**: Full integration with streaming text responses
- **Message Flow**: User input → WebSocket → OpenAI → streaming AI response
- **Status Tracking**: Real-time visual feedback for message processing
- **Error Recovery**: Graceful handling of connection issues and API errors

### Enhanced User Experience ✅

- **Spiritual Theming**: Beautiful gradient backgrounds and meaningful iconography
- **Authentication**: Seamless user authentication with Clerk
- **Connection Monitoring**: Real-time connection status with animated indicators
- **Responsive Design**: Professional interface that works on mobile and desktop
- **Loading States**: Visual feedback for all user actions and system states

### Developer Experience ✅

- **NX Monorepo**: Scalable workspace with shared libraries and dependency management
- **TypeScript**: Full type safety with comprehensive interfaces and JSDoc
- **Performance**: Optimized components with React.memo and proper callback usage
- **Error Handling**: Robust error boundaries and user-friendly error messages
- **Documentation**: Complete documentation for setup, development, and deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **pnpm** (version 8 or higher)
- **Git**

Check your versions:

```bash
node --version
pnpm --version
git --version
```

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd smriti
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

#### Frontend App (Next.js)

Copy the environment template and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/web/.env.local` with your Clerk credentials:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Next.js Configuration
NEXT_PUBLIC_APP_URL=http://localhost:4200
PORT=4200
```

#### WebSocket Server

Copy the environment template and fill in your values:

```bash
cp apps/ws-server/.env.example apps/ws-server/.env
```

Edit `apps/ws-server/.env` with your API keys:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Clerk Authentication (use the same secret key as frontend)
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:4200

# Logging
LOG_LEVEL=info
```

### 4. API Keys Setup

You'll need to obtain the following API keys:

#### Clerk Authentication

1. Visit [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the **Publishable Key** and **Secret Key**
4. Add them to both environment files

#### OpenAI API

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an API key
3. Add it to `apps/ws-server/.env`

## 🚀 Running the Applications

### Development Mode

Run both applications in separate terminal windows:

#### Terminal 1 - WebSocket Server

```bash
# Starts the WebSocket server on http://localhost:3000
npx nx serve ws-server
```

#### Terminal 2 - Web Application

```bash
# Starts the Next.js app on http://localhost:4200
npx nx serve web
```

### Other Useful Commands

```bash
# Build all applications
npx nx run-many -t build

# Run tests for all projects
npx nx run-many -t test

# Lint all projects
npx nx run-many -t lint

# Type checking
npx nx run-many -t typecheck

# Build specific application
npx nx build web
npx nx build ws-server

# Build shared libraries
npx nx build types
npx nx build constants
npx nx build utils
npx nx build logger
```

## 🔐 Authentication

The application uses Clerk for authentication with automatic middleware handling:

1. Visit `http://localhost:4200` - you'll see the chat interface if authenticated
2. Unauthenticated users are automatically redirected to Clerk's sign-in interface
3. After authentication, users can immediately start chatting with Smriti AI
4. The interface provides real-time feedback for connection status and message processing

## 🏗️ Project Structure

### Applications

- **`apps/web`**: Next.js frontend with real-time chat interface and WebSocket integration
- **`apps/ws-server`**: Node.js WebSocket server with OpenAI Realtime API integration

### Shared Libraries

- **`packages/shared/types`**: TypeScript interfaces for WebSocket messages, API types, and application state
- **`packages/shared/constants`**: Configuration constants, WebSocket events, and application settings
- **`packages/shared/utils`**: Utility functions for message handling, validation, and data processing
- **`packages/shared/logger`**: Structured logging system with Pino for comprehensive debugging

## 📝 Development Notes

### Port Configuration

- **WebSocket server**: Port 3000 (configurable via PORT env var)
- **Next.js web app**: Port 4200 (configurable via PORT env var)
- **Environment**: Development and production configurations supported

### WebSocket Implementation

- **Connection Management**: Auto-connecting with exponential backoff reconnection
- **Event Handling**: Comprehensive OpenAI Realtime API event processing
- **Error Recovery**: Graceful handling of network interruptions and API errors
- **Performance**: Optimized to prevent unnecessary re-renders and connection cycling

### Code Quality

- **TypeScript**: Strict type checking with comprehensive interfaces
- **Documentation**: JSDoc documentation for all hooks and components
- **Error Handling**: Robust error boundaries and user feedback
- **Performance**: Memoized components and optimized callback usage

## 🧪 Testing

### Frontend Testing

```bash
# Run web application tests
npx nx test web

# Type checking
npx nx typecheck web

# Linting
npx nx lint web
```

### Shared Libraries Testing

```bash
# Test shared libraries
npx nx test types
npx nx test utils
npx nx test constants
npx nx test logger
```

### Workspace Commands

```bash
# Show project graph
npx nx graph

# Show project details
npx nx show project web
npx nx show project ws-server

# Run commands across multiple projects
npx nx run-many -t build
npx nx run-many -t lint
npx nx run-many -t typecheck

# Clear NX cache
npx nx reset
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

- **ChatInterface**: Main orchestrator component with connection management
- **Header**: Real-time connection status and user profile integration
- **MessageBubble**: Individual message display with status indicators
- **MessageList**: Auto-scrolling message container with typing indicators
- **MessageInput**: Text input with validation and send functionality

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000 (WebSocket server) or 4200 (Next.js app)
lsof -ti:3000
lsof -ti:4200

# Kill the process
kill -9 <PID>
```

#### Dependencies Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear NX cache
npx nx reset
```

#### WebSocket Connection Issues

- Ensure WebSocket server is running on port 3000
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify firewall settings and network connectivity
- Monitor browser console for connection logs

#### Environment Variables Not Loading

- Ensure `.env.local` exists in `apps/web/`
- Ensure `.env` exists in `apps/ws-server/`
- Restart development servers after adding environment variables
- Verify Clerk and OpenAI API keys are correct

## 📚 Development Workflow

### Adding New Features

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Use Shared Libraries**

   ```typescript
   // Import from shared libraries using path mappings
   import { YourType } from '@smriti/types';
   import { yourUtil } from '@smriti/utils';
   import { CONSTANTS } from '@smriti/constants';
   import { logger } from '@smriti/logger';
   ```

3. **Follow TypeScript Best Practices**
   - Use comprehensive interfaces with JSDoc documentation
   - Implement proper error handling with typed errors
   - Use React.memo and useCallback for performance optimization

### Code Quality

```bash
# Format code
npx nx format

# Lint and fix
npx nx run-many -t lint --fix

# Type checking
npx nx run-many -t typecheck
```

## 🔮 Next Development Phase: Audio Features

### Audio Recording & Streaming

- **MediaRecorder API**: Voice input capture and streaming
- **Real-time Audio**: WebSocket audio transmission to OpenAI
- **Audio Processing**: Format conversion and quality optimization

### Audio Playback & Controls

- **Web Audio API**: High-quality audio response playback
- **Audio Controls**: Play, pause, volume, and seek functionality
- **Voice Interface**: Push-to-talk and continuous recording modes

### Enhanced User Experience

- **Audio Visualizations**: Voice level indicators and waveforms
- **Multimodal Responses**: Coordinated audio and text display
- **Session Management**: Voice conversation state and history

## 🔗 External Resources

- [NX Documentation](https://nx.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📝 Current Status Summary

✅ **Production-Ready Text Chat**: Complete real-time text messaging with OpenAI Realtime API
✅ **Robust Architecture**: Scalable NX monorepo with comprehensive shared libraries
✅ **WebSocket Integration**: Stable, production-ready WebSocket communication
✅ **Beautiful UI**: Spiritual-themed responsive interface with excellent UX
✅ **Developer Experience**: Full TypeScript support with comprehensive documentation
🚧 **Audio Features**: Architecture ready for voice recording and playback implementation

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Follow TypeScript and code quality guidelines
4. Add comprehensive documentation
5. Run tests and linting
6. Commit your changes
7. Push to the branch
8. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

**Ready for Production**: The current implementation provides a robust, production-ready text chat experience with OpenAI Realtime API integration. The architecture is designed for scalability and ready for audio feature implementation in the next development phase.

**Happy Coding! 🚀**

For questions or support, please refer to the documentation or create an issue in the repository.
