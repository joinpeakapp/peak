import React from 'react';
import { View, Image } from 'react-native';

interface PlusOneStickerProps {
  size: number;
  showDynamicText?: boolean;
}

export const PlusOneSticker: React.FC<PlusOneStickerProps> = ({ 
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
      {/* Image PNG du sticker +1 (toujours afficher +1, jamais +2, +3, etc.) */}
      <Image 
        source={require('../../../assets/stickers/Peak +1.png')}
        style={{
          width: size,
          height: size,
          position: 'absolute',
        }}
        resizeMode="contain"
      />
    </View>
  );
};
