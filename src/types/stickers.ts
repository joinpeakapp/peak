// Types pour les badges et stickers des séances d'entraînement
// Ces types sont utilisés pour afficher les réalisations et les médailles

// Interface de base pour un badge (affichage visuel simple)
export interface StickerBadge {
  label: string;              // Texte à afficher sur le badge
  backgroundColor: string;    // Couleur de fond
  borderColor: string;        // Couleur de bordure
  textColor: string;          // Couleur du texte
}

// Interface enrichie pour un sticker (badge avec icône et informations supplémentaires)
export interface Sticker {
  name: string;               // Nom du sticker/badge (ex: "Endurance", "Variety", "New Record", "Complete")
  icon: string;               // Nom de l'icône Ionicons à afficher
  color: string;              // Couleur principale du sticker
}

// Type pour les différentes catégories de stickers disponibles
export type StickerType = 
  | 'streak'                  // Série de séances consécutives
  | 'endurance'               // Séances longues (durée élevée)
  | 'variety'                 // Diversité d'exercices
  | 'personal-record'         // Nouveau record personnel
  | 'completion'              // Complétion de séance (basique)
  | 'consistency'             // Assiduité sur une période
  | 'intensity'               // Intensité de l'entraînement
  | 'progress'                // Progression significative
  | 'milestone';              // Jalon important (nombre de séances, etc.)

// Informations supplémentaires pour l'affichage des étapes d'animation
export interface StepInfo {
  title: string;              // Titre principal à afficher
  subtitle: string;           // Sous-titre explicatif
} 