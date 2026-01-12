/**
 * Service de tracking d'erreurs pour l'application Peak
 * 
 * En développement: logge les erreurs dans la console
 * En production: peut être étendu pour envoyer les erreurs à un service externe (Sentry, etc.)
 * 
 * Utilisation:
 *   import errorTrackingService from './services/errorTrackingService';
 *   errorTrackingService.captureException(error);
 *   errorTrackingService.captureMessage('Something went wrong', 'error');
 */

import logger from '../utils/logger';

interface ErrorContext {
  [key: string]: unknown;
}

interface ErrorTrackingService {
  captureException: (error: Error | unknown, context?: ErrorContext) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error', context?: ErrorContext) => void;
  setUser: (userId: string, userData?: Record<string, unknown>) => void;
  clearUser: () => void;
}

class ErrorTrackingServiceImpl implements ErrorTrackingService {
  private userId: string | null = null;
  private userData: Record<string, unknown> | null = null;

  /**
   * Capture une exception/erreur
   */
  captureException(error: Error | unknown, context?: ErrorContext): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    // Toujours logger l'erreur
    logger.error('[ErrorTracking] Exception captured:', {
      message: errorObj.message,
      stack: errorObj.stack,
      context,
      userId: this.userId,
      userData: this.userData,
    });

    // TODO: En production, envoyer à un service externe (Sentry, etc.)
    // if (!__DEV__) {
    //   Sentry.captureException(errorObj, {
    //     contexts: { custom: context },
    //     user: this.userId ? { id: this.userId, ...this.userData } : undefined,
    //   });
    // }
  }

  /**
   * Capture un message d'erreur ou d'information
   */
  captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'error',
    context?: ErrorContext
  ): void {
    const logData = {
      message,
      level,
      context,
      userId: this.userId,
      userData: this.userData,
    };

    // Logger selon le niveau
    switch (level) {
      case 'info':
        logger.info('[ErrorTracking]', logData);
        break;
      case 'warning':
        logger.warn('[ErrorTracking]', logData);
        break;
      case 'error':
        logger.error('[ErrorTracking]', logData);
        break;
    }

    // TODO: En production, envoyer à un service externe
    // if (!__DEV__ && level === 'error') {
    //   Sentry.captureMessage(message, {
    //     level: level as Sentry.SeverityLevel,
    //     contexts: { custom: context },
    //     user: this.userId ? { id: this.userId, ...this.userData } : undefined,
    //   });
    // }
  }

  /**
   * Associer un utilisateur aux erreurs suivantes
   */
  setUser(userId: string, userData?: Record<string, unknown>): void {
    this.userId = userId;
    this.userData = userData || null;
    logger.log('[ErrorTracking] User set:', { userId, userData });
  }

  /**
   * Retirer l'association utilisateur
   */
  clearUser(): void {
    this.userId = null;
    this.userData = null;
    logger.log('[ErrorTracking] User cleared');
  }
}

// Instance singleton
const errorTrackingService = new ErrorTrackingServiceImpl();

export default errorTrackingService;



