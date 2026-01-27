import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Sticker } from '../../types/stickers';
import { 
  CompletionSticker, 
  PRSticker, 
  PlusOneSticker,
  StreakSticker, 
  VolumeSticker 
} from '../stickers';

export interface StickerBadgeProps {
  sticker: Sticker;
  size: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  showText?: boolean;
  style?: ViewStyle;
}

/**
 * Composant sticker adaptable pour tous les contextes d'affichage.
 * Utilise les nouveaux composants SVG avec texte dynamique.
 */
export const StickerBadge: React.FC<StickerBadgeProps> = ({
  sticker,
  size,
  showText = false,
  style
}) => {
  
  // Configuration des tailles
  const sizeConfig = {
    small: {
      circleSize: 24,
    },
    medium: {
      circleSize: 32,
    },
    large: {
      circleSize: 80,
    },
    xlarge: {
      circleSize: 64,
    },
    xxlarge: {
      circleSize: 200,
    }
  };

  const config = sizeConfig[size];
  const stickerSize = config.circleSize;

  // Rendu du composant SVG approprié
  const renderStickerSVG = () => {
    const commonProps = {
      size: stickerSize,
      showDynamicText: showText
    };

    switch (sticker.type) {
      case 'completion':
        return <CompletionSticker {...commonProps} />;
      
      case 'personal-record':
        return <PRSticker {...commonProps} />;
      
      case 'plus-one':
        return <PlusOneSticker {...commonProps} />;
      
      case 'streak':
        return (
          <StreakSticker 
            {...commonProps} 
            streakCount={sticker.dynamicValue || 1}
          />
        );
      
      case 'volume':
        return (
          <VolumeSticker 
            {...commonProps} 
            volumePercentage={sticker.dynamicValue || 10}
          />
        );
      
      default:
        // Fallback vers le sticker completion si type inconnu
        return <CompletionSticker {...commonProps} />;
    }
  };

  return (
    <View style={[styles.container, style]}>
      {renderStickerSVG()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
});