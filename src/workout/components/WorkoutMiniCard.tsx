import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CompletedWorkout } from '../../types/workout';
import { CachedImageBackground } from '../../components/common/CachedImageBackground';
import { StickerBadge } from '../../components/common/StickerBadge';
import { Sticker } from '../../types/stickers';

interface WorkoutMiniCardProps {
  workout: CompletedWorkout;
  imageUri: string;
  stickers: Sticker[];
  onPress: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

const { width } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = (width - (16 * 2) - (8 * 2)) / 3;
const DEFAULT_CARD_HEIGHT = DEFAULT_CARD_WIDTH * (192 / 114); // Ratio 114x192px

export const WorkoutMiniCard: React.FC<WorkoutMiniCardProps> = ({
  workout,
  imageUri,
  stickers,
  onPress,
  cardWidth = DEFAULT_CARD_WIDTH,
  cardHeight = DEFAULT_CARD_HEIGHT,
}) => {
  // Vérifier si c'est un placeholder ou pas de photo
  const hasNoPhoto = !imageUri || imageUri.includes('placeholder');
  
  const cardContent = (
    <CachedImageBackground 
      uri={imageUri}
      style={[styles.cardImage, { width: cardWidth, height: cardHeight }]}
      imageStyle={styles.cardImageStyle}
      showLoader={false}
      workout={workout}
    >
      {/* Logo Peak en overlay si pas de photo */}
      {hasNoPhoto && (
        <View style={styles.logoOverlay}>
          <Image
            source={require('../../../assets/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      )}
      
      <LinearGradient
        colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)']}
        style={styles.cardGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <View style={styles.cardContent}>
          {/* Container de stickers */}
          {stickers.length > 0 && (
            <View style={[
              styles.stickersContainer,
              stickers.length === 4 && styles.stickersContainerCompact
            ]}>
              {stickers.map((sticker, idx) => (
                <StickerBadge
                  key={`sticker-${idx}`}
                  sticker={sticker}
                  size="small"
                  showText={false}
                  style={styles.stickerSpacing}
                />
              ))}
            </View>
          )}
          
          {/* Nom de la séance */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {workout.name || 'Quick Workout'}
          </Text>
        </View>
      </LinearGradient>
    </CachedImageBackground>
  );

  return (
    <TouchableOpacity 
      style={[styles.cardContainer, { width: cardWidth, height: cardHeight }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.card}>
        {cardContent}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginRight: 8,
    marginBottom: 0,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242526',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  cardImageStyle: {
    borderRadius: 8,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderRadius: 8,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: 8,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  stickersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 2, // Padding horizontal pour éviter les coupures
  },
  stickersContainerCompact: {
    gap: 1, // Espacement encore plus réduit pour 4 stickers
    paddingHorizontal: 1, // Padding réduit pour 4 stickers
  },
  stickerSpacing: {
    marginHorizontal: 1,
  },
  logoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  logoImage: {
    width: '40%',
    height: '40%',
    opacity: 0.2,
  },
});

