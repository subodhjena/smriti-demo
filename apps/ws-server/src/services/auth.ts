import { AuthToken } from '../types';
import { logger } from '@smriti/logger';

class AuthService {
  private clerkSecretKey: string;

  constructor() {
    this.clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
    if (!this.clerkSecretKey) {
      logger.warn('CLERK_SECRET_KEY not found in environment variables');
    }
  }

  /**
   * Validate authentication token from WebSocket connection
   * For demo purposes, this is a simplified implementation
   */
  async validateToken(token: string): Promise<AuthToken | null> {
    try {
      // For demo: simple token validation
      // In production, this would validate JWT with Clerk
      if (!token || token.length < 10) {
        return null;
      }

      // Mock validation - in real implementation, use Clerk SDK to verify JWT
      const decoded: AuthToken = {
        userId: token.replace('demo_', ''), // Extract user ID from demo token
        exp: Date.now() + 3600000, // 1 hour from now
        iat: Date.now()
      };

      return decoded;
    } catch (error) {
      logger.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Extract token from WebSocket connection request
   */
  extractTokenFromRequest(url: string, headers: Record<string, any>): string | null {
    // Try to get token from query parameter
    const urlObj = new URL(url, 'ws://localhost:3000');
    const tokenFromQuery = urlObj.searchParams.get('token');
    
    if (tokenFromQuery) {
      return tokenFromQuery;
    }

    // Try to get token from Authorization header
    const authHeader = headers.authorization || headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Generate demo token for testing
   * In production, this would be handled by Clerk on the frontend
   */
  generateDemoToken(userId: string): string {
    return `demo_${userId}_${Date.now()}`;
  }
}

export const authService = new AuthService(); 