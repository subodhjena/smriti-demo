'use client';

interface VoiceButtonProps {
  /** Whether voice conversation is active */
  isActive: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Callback fired when button is clicked */
  onClick: () => void;
}

/**
 * Simple voice button: mic when inactive, stop when active
 */
export function VoiceButton({
  isActive,
  disabled = false,
  onClick,
}: VoiceButtonProps) {
  
  const handleClick = () => {
    if (disabled) return;
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`btn btn-circle w-12 h-12 flex items-center justify-center ${
        isActive 
          ? 'bg-error text-error-content hover:bg-error/90' 
          : 'bg-primary text-primary-content hover:bg-primary/90'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      title={isActive ? 'Stop conversation' : 'Start voice conversation'}
    >
      {isActive ? (
        // Stop icon
        <div className="w-3 h-3 bg-current rounded-sm" />
      ) : (
        // Mic icon
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
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      )}
    </button>
  );
} 