// Types pour les badges et stickers des séances d'entraînement
// Ces types sont utilisés pour afficher les réalisations et les médailles

// Interface de base pour un badge (affichage visuel simple)
export interface StickerBadge {
  label: string;              // Texte à afficher sur le badge
  backgroundColor: string;    // Couleur de fond
  borderColor: string;        // Couleur de bordure
  textColor: string;          // Couleur du texte
}

// Interface enrichie pour un sticker (badge avec SVG et informations supplémentaires)
export interface Sticker {
  name: string;               // Nom du sticker/badge (ex: "Completion", "PR", "Star", "Streak", "Volume")
  type: StickerType;          // Type du sticker pour identifier le composant SVG à utiliser
  color: string;              // Couleur principale du sticker
  dynamicValue?: number;      // Valeur dynamique à afficher (streak count, completion count, volume %, etc.)
}

// Type pour les nouvelles catégories de stickers disponibles
export type StickerType = 
  | 'completion'              // 100% - Toutes séries complétées sans séries vides
  | 'personal-record'         // PR - Nouveau record personnel réalisé
  | 'plus-one'                // +1 - Au moins un +1 (ou +2, etc.) obtenu dans la séance
  | 'streak'                  // Streak - Série de séances consécutives
  | 'volume';                 // Volume - Volume 10%+ supérieur à la même séance précédente

// Informations supplémentaires pour l'affichage des étapes d'animation
export interface StepInfo {
  title: string;              // Titre principal à afficher
  subtitle: string;           // Sous-titre explicatif
} 