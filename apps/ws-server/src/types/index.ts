export interface Session {
  id: string;
  userId: string;
  connectionId: string;
  createdAt: Date;
  lastActivity: Date;
  status: 'active' | 'inactive' | 'ended';
  metadata?: Record<string, any>;
}

export interface ConnectionContext {
  sessionId: string;
  userId?: string;
  authenticated: boolean;
  connectionTime: Date;
  lastPing?: Date;
}

export interface AuthToken {
  userId: string;
  sessionId?: string;
  exp: number;
  iat: number;
} 