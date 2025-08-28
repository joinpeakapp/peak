import ImageOptimizationService from '../services/imageOptimizationService';

/**
 * Utilitaires de débogage pour les images
 */
export class ImageDebugUtils {
  
  /**
   * Affiche les statistiques complètes du cache d'images
   */
  static async logImageCacheStats(): Promise<void> {
    try {
      console.log('🔍 [ImageDebug] === IMAGE CACHE STATISTICS ===');
      
      const diagnosis = await ImageOptimizationService.diagnoseCache();
      
      console.log('📊 Cache Stats:', diagnosis.stats);
      console.log('📁 Total Items:', diagnosis.totalItems);
      console.log('❌ Missing Files:', diagnosis.missingFiles.length);
      
      if (diagnosis.missingFiles.length > 0) {
        console.log('🗂️ Missing Files List:', diagnosis.missingFiles);
      }
      
      console.log('🔍 [ImageDebug] === END STATISTICS ===');
    } catch (error) {
      console.error('🔍 [ImageDebug] Error getting stats:', error);
    }
  }

  /**
   * Reset complet du système d'images (à utiliser en cas de problème)
   */
  static async performEmergencyReset(): Promise<void> {
    try {
      console.log('🚨 [ImageDebug] PERFORMING EMERGENCY RESET...');
      await ImageOptimizationService.resetAllImageData();
      console.log('✅ [ImageDebug] Emergency reset completed');
    } catch (error) {
      console.error('❌ [ImageDebug] Emergency reset failed:', error);
    }
  }

  /**
   * Test la validation d'URI
   */
  static testImageUri(uri: string): void {
    console.log(`🔍 [ImageDebug] Testing URI: ${uri}`);
    // Note: isValidImageUri est private, mais on peut tester manuellement
    
    const isValid = (
      uri &&
      typeof uri === 'string' &&
      (uri.startsWith('file://') || 
       uri.startsWith('content://') || 
       uri.startsWith('ph://') ||
       uri.startsWith('http://') || 
       uri.startsWith('https://') ||
       uri.startsWith('/'))
    );
    
    console.log(`🔍 [ImageDebug] URI is ${isValid ? 'VALID' : 'INVALID'}`);
  }
}

// Pour utiliser dans la console du développeur :
// import { ImageDebugUtils } from './src/utils/imageDebugUtils';
// ImageDebugUtils.logImageCacheStats();
// ImageDebugUtils.performEmergencyReset();

