import i18n from './index';

/**
 * Traduit le nom d'un exercice selon la langue actuelle
 * Si la traduction n'existe pas, retourne le nom original
 */
export const translateExerciseName = (exerciseName: string): string => {
  // Normaliser le nom pour créer la clé de traduction
  const normalizedName = exerciseName.toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '');
  
  const translationKey = `exercises.${normalizedName}`;
  const translation = i18n.t(translationKey, { defaultValue: exerciseName });
  
  // Si la traduction retourne la clé elle-même, c'est qu'elle n'existe pas
  if (translation === translationKey) {
    return exerciseName;
  }
  
  return translation;
};

/**
 * Retourne le nom original d'un exercice depuis sa traduction
 * Utile pour sauvegarder le nom original en base de données
 */
export const getOriginalExerciseName = (translatedName: string): string => {
  // Pour l'instant, on retourne le nom traduit tel quel
  // On pourrait implémenter une logique inverse si nécessaire
  return translatedName;
};

