import { Session } from '../types';
import { logger } from '@smriti/logger';

class SessionService {
  private sessions: Map<string, Session> = new Map();
  private readonly sessionTimeout: number = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor() {
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
  }

  /**
   * Create a new session for a user
   */
  createSession(userId: string, connectionId: string): string {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const session: Session = {
      id: sessionId,
      userId,
      connectionId,
      createdAt: now,
      lastActivity: now,
      status: 'active',
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    
    logger.info('Session created', {
      sessionId,
      userId,
      connectionId
    });

    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session is expired
    if (this.isSessionExpired(session)) {
      this.endSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session activity timestamp
   */
  updateActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      logger.debug('Session activity updated', { sessionId });
    }
  }

  /**
   * End a session
   */
  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'ended';
      this.sessions.delete(sessionId);
      
      logger.info('Session ended', {
        sessionId,
        userId: session.userId,
        duration: Date.now() - session.createdAt.getTime()
      });
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(
      session => session.status === 'active' && !this.isSessionExpired(session)
    );
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if session is expired
   */
  private isSessionExpired(session: Session): boolean {
    const now = Date.now();
    const lastActivity = session.lastActivity.getTime();
    return (now - lastActivity) > this.sessionTimeout;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const expiredSessions: string[] = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (this.isSessionExpired(session)) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      logger.info('Cleaning up expired session', { sessionId });
      this.endSession(sessionId);
    });

    if (expiredSessions.length > 0) {
      logger.info(`Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

export const sessionService = new SessionService(); 