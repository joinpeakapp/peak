/**
 * Logger conditionnel pour l'application Peak
 * 
 * - En développement (__DEV__): logge tout
 * - En production: logge uniquement les erreurs critiques
 * 
 * Utilisation:
 *   import logger from './utils/logger';
 *   logger.log('Message de debug');
 *   logger.warn('Avertissement');
 *   logger.error('Erreur');
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
}

const logger: Logger = {
  /**
   * Log normal - uniquement en développement
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log d'information - uniquement en développement
   */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  /**
   * Log de debug - uniquement en développement
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Avertissement - uniquement en développement
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Erreur - toujours loggé (même en production)
   * Les erreurs sont critiques et doivent être trackées
   */
  error: (...args: unknown[]) => {
    // Toujours logger les erreurs, même en production
    console.error(...args);
    
    // En production, capturer les erreurs critiques pour le tracking
    if (!isDev && args.length > 0) {
      try {
        const errorTrackingService = require('../services/errorTrackingService').default;
        const firstArg = args[0];
        if (firstArg instanceof Error) {
          errorTrackingService.captureException(firstArg, {
            additionalArgs: args.slice(1),
          });
        } else if (typeof firstArg === 'string') {
          errorTrackingService.captureMessage(firstArg, 'error', {
            additionalArgs: args.slice(1),
          });
        }
      } catch {
        // Ignorer les erreurs de tracking pour éviter les boucles infinies
      }
    }
  },
};

export default logger;

