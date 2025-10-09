import React from 'react';
import { View, Text, Image } from 'react-native';

interface PRStickerProps {
  size: number;
  showDynamicText?: boolean;
}

export const PRSticker: React.FC<PRStickerProps> = ({ 
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
        source={require('../../../assets/stickers/Peak PR.png')}
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