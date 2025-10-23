import React from 'react';
import { View, Text, Image, Platform } from 'react-native';

interface VolumeStickerProps {
  size: number;
  volumePercentage?: number;
  showDynamicText?: boolean;
}

export const VolumeSticker: React.FC<VolumeStickerProps> = ({ 
  size, 
  volumePercentage = 10,
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
        source={require('../../../assets/stickers/Peak volume.png')}
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
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: -2,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: -2,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: -2,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: 0,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: 0,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: -2, top: 2,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: 2,
          }}>
            +{volumePercentage}%
          </Text>
          <Text style={{
            color: 'white',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 2, top: 2,
          }}>
            +{volumePercentage}%
          </Text>
          
          {/* Texte principal noir par-dessus */}
          <Text style={{
            color: 'black',
            fontSize: Math.max(14, size * 0.15),
            fontFamily: 'Poppins-Bold',
            fontWeight: 'bold',
            textAlign: 'center',
            position: 'absolute',
            left: 0, top: 0,
          }}>
            +{volumePercentage}%
          </Text>
        </View>
      )}
    </View>
  );
};