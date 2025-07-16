import { useState, useRef, KeyboardEvent } from 'react';
import { VoiceButton } from './VoiceButton';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onVoiceClick: () => void;
  isVoiceActive?: boolean;
  audioLevel?: number;
  disabled?: boolean;
  placeholder?: string;
  isAIResponding?: boolean;
}

export function MessageInput({
  onSendMessage,
  onVoiceClick,
  isVoiceActive = false,
  audioLevel = 0,
  disabled = false,
  placeholder = "Type your message...",
  isAIResponding = false
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Determine if input should be disabled
  const isInputDisabled = disabled || isAIResponding || isVoiceActive;
  
  const handleSubmit = () => {
    if (message.trim() && !isInputDisabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isInputDisabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isInputDisabled) return;
    
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Get dynamic placeholder based on state
  const getPlaceholder = () => {
    if (isVoiceActive) return "Voice conversation active...";
    if (isAIResponding) return "AI is responding...";
    return placeholder;
  };

  return (
    <div className="border-t border-base-300 bg-base-100 px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Voice Button */}
          <VoiceButton
            isActive={isVoiceActive}
            disabled={disabled || isAIResponding}
            onClick={onVoiceClick}
          />

          {/* Message Input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholder()}
              disabled={isInputDisabled}
              rows={1}
              className={`textarea textarea-bordered w-full resize-none min-h-[48px] max-h-32 py-3 px-4 text-base leading-5 transition-opacity ${
                isInputDisabled ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              style={{ overflow: 'hidden' }}
            />
            {/* Loading indicator overlay */}
            {isAIResponding && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="loading loading-dots loading-sm text-primary"></span>
              </div>
            )}
            {/* Voice conversation indicator */}
            {isVoiceActive && !isAIResponding && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-success">Voice Active</span>
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isInputDisabled}
            className={`btn btn-primary btn-circle w-12 h-12 flex items-center justify-center transition-all ${
              (!message.trim() || isInputDisabled) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            {isAIResponding ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 