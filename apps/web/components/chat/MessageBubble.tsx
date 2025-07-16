import { memo } from 'react';

/**
 * Represents a message in the conversation
 */
interface OpenAIMessage {
  /** Unique identifier for the message */
  id: string;
  /** Text content of the message */
  content: string;
  /** Who sent the message */
  sender: 'user' | 'ai';
  /** When the message was created */
  timestamp: Date;
  /** Current processing status of the message */
  status: 'sending' | 'sent' | 'receiving' | 'completed' | 'error';
}

interface MessageBubbleProps {
  /** The message to display */
  message: OpenAIMessage;
}

/**
 * Individual message bubble component that displays a single message
 * with appropriate styling, status indicators, and timestamps.
 * 
 * @param props Component props
 */
function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  
  /**
   * Returns the appropriate status indicator based on message status
   */
  const getStatusIndicator = () => {
    switch (message.status) {
      case 'sending':
        return (
          <div className="flex items-center gap-1 mt-1">
            <span className="loading loading-dots loading-xs"></span>
            <span className="text-xs opacity-60">Sending...</span>
          </div>
        );
      case 'receiving':
        return (
          <div className="flex items-center gap-1 mt-1">
            <span className="loading loading-dots loading-xs"></span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-error text-xs">⚠</span>
            <span className="text-xs text-error">Failed to send</span>
          </div>
        );
      case 'sent':
      case 'completed':
      default:
        return null;
    }
  };

  /**
   * Returns the appropriate opacity class based on message status
   */
  const getBubbleOpacity = () => {
    if (message.status === 'sending' || message.status === 'error') {
      return 'opacity-70';
    }
    return '';
  };

  /**
   * Returns the display content, handling empty content during receiving state
   */
  const getDisplayContent = () => {
    if (message.content) {
      return message.content;
    }
    
    if (message.status === 'receiving') {
      return ''; // Show empty content while receiving
    }
    
    return 'Sending...'; // Fallback for other states
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] sm:max-w-[60%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-2xl transition-all duration-200 ${getBubbleOpacity()} ${
            isUser
              ? 'bg-primary text-primary-content rounded-br-sm'
              : 'bg-base-200 text-base-content rounded-bl-sm border border-base-300'
          }`}
        >
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {getDisplayContent()}
          </p>
          {getStatusIndicator()}
        </div>
        
        {/* Show timestamp only for completed messages */}
        {message.status === 'completed' && (
          <div className={`text-xs opacity-50 mt-1 px-2 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component for better performance
export const MessageBubble = memo(MessageBubbleComponent); 