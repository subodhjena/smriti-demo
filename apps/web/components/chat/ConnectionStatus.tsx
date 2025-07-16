import { WSConnectionStatus } from '@smriti/types';

interface ConnectionStatusProps {
  status: WSConnectionStatus;
  error?: string | null;
}

export function ConnectionStatus({ status, error }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'bg-success',
          text: 'Connected',
          textColor: 'text-success',
          animate: false,
        };
      case 'connecting':
        return {
          color: 'bg-warning',
          text: 'Connecting...',
          textColor: 'text-warning',
          animate: true,
        };
      case 'reconnecting':
        return {
          color: 'bg-warning',
          text: 'Reconnecting...',
          textColor: 'text-warning',
          animate: true,
        };
      case 'disconnected':
        return {
          color: 'bg-base-300',
          text: 'Disconnected',
          textColor: 'text-base-content/60',
          animate: false,
        };
      case 'error':
        return {
          color: 'bg-error',
          text: error || 'Connection Error',
          textColor: 'text-error',
          animate: false,
        };
      default:
        return {
          color: 'bg-base-300',
          text: 'Unknown',
          textColor: 'text-base-content/60',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div 
          className={`w-3 h-3 rounded-full ${config.color} ${
            config.animate ? 'animate-pulse' : ''
          }`}
        />
        {status === 'connected' && (
          <div className="absolute inset-0 w-3 h-3 bg-success rounded-full animate-ping opacity-40" />
        )}
      </div>
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
} 