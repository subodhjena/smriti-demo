import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

interface OpenAIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status: 'sending' | 'sent' | 'receiving' | 'completed' | 'error';
}

interface MessageListProps {
  messages: OpenAIMessage[];
  isAIResponding?: boolean;
}

export function MessageList({ messages, isAIResponding = false }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAIResponding]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-2xl">🧘‍♀️</span>
              </div>
              <h3 className="text-xl font-semibold text-base-content mb-2">
                Welcome to Smriti
              </h3>
              <p className="text-base-content/70 max-w-md">
                I&apos;m here to provide spiritual guidance and support. How can I assist you today?
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
} 