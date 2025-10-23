import React from 'react';
import { View, Text, Image, Platform } from 'react-native';

interface StarStickerProps {
  size: number;
  completionCount?: number;
  showDynamicText?: boolean;
}

export const StarSticker: React.FC<StarStickerProps> = ({ 
  size, 
  completionCount = 1,
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
        source={require('../../../assets/stickers/Peak star.png')}
        style={{
          width: size,
          height: size,
          position: 'absolute',
        }}
        resizeMode="contain"
      />
      
      {/* Texte dynamique par-dessus si nécessaire */}
      {showDynamicText && (
        <View style={{ position: 'absolute' }}>
          {/* Contour blanc - 8 directions */}
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: -2,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: -2,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: -2,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: 0,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: 0,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: 2,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: 2,
          }}>
            {completionCount}
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: 2,
          }}>
            {completionCount}
          </Text>
          
          {/* Texte principal noir par-dessus */}
          <Text style={{
            color: 'black',
            fontSize: Math.max(14, size * 0.2),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: 0,
          }}>
            {completionCount}
          </Text>
        </View>
      )}
    </View>
  );
};