import { UserButton, useUser } from '@clerk/nextjs';
import { WSConnectionStatus } from '@smriti/types';

interface HeaderProps {
  /** Current WebSocket connection status */
  connectionStatus: WSConnectionStatus;
  /** Current connection error, if any */
  error?: string | null;
}

/**
 * Main application header component with branding, connection status, and user controls.
 * 
 * @param props Component props
 */
export function Header({ connectionStatus, error }: HeaderProps) {
  const { user } = useUser();
  
  const getStatusDotConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          color: 'bg-success',
          animate: false,
        };
      case 'connecting':
        return {
          color: 'bg-warning',
          animate: true,
        };
      case 'reconnecting':
        return {
          color: 'bg-warning',
          animate: true,
        };
      case 'disconnected':
        return {
          color: 'bg-base-300',
          animate: false,
        };
      case 'error':
        return {
          color: 'bg-error',
          animate: false,
        };
      default:
        return {
          color: 'bg-base-300',
          animate: false,
        };
    }
  };

  const statusConfig = getStatusDotConfig();

  return (
    <header className="bg-base-100 border-b border-base-300 px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Smriti Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">💧</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-base-content">Smriti</h1>
          </div>
        </div>

        {/* User Profile with Hello message and status dot */}
        <div className="flex items-center gap-3">
          <span className="text-base font-medium text-base-content hidden sm:block">
            Hello {user?.firstName || 'User'}!
          </span>
          <div className="relative">
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                  userButtonPopoverCard: "shadow-xl",
                  userButtonPopoverActionButton: "hover:bg-base-200"
                }
              }}
            />
            {/* Status dot overlay on profile photo */}
            <div className="absolute -top-1 -right-1">
              <div className={`w-3 h-3 rounded-full border-2 border-base-100 ${statusConfig.color} ${
                statusConfig.animate ? 'animate-pulse' : ''
              }`} />
              {connectionStatus === 'connected' && (
                <div className="absolute inset-0 w-3 h-3 bg-success rounded-full animate-ping opacity-40" />
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 