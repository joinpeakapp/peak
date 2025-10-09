import React from 'react';
import { View, Text, Image } from 'react-native';

interface CompletionStickerProps {
  size: number;
  showDynamicText?: boolean;
}

export const CompletionSticker: React.FC<CompletionStickerProps> = ({ 
  size, 
  showDynamicText = false 
}) => {
  return (
    <View style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      {/* Image PNG de ton sticker */}
      <Image 
        source={require('../../../assets/stickers/Peak 100.png')}
        style={{
          width: size,
          height: size,
          position: 'absolute',
        }}
        resizeMode="contain"
      />
      
      {/* Pas de texte dynamique pour ce sticker */}
    </View>
  );
};