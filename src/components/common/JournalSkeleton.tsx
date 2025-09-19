import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

const { width: screenWidth } = Dimensions.get('window');
const GAP = 8;
const CARD_WIDTH = (screenWidth - 32 - (GAP * 2)) / 3; // 32 = padding horizontal, GAP * 2 = espaces entre cartes

interface JournalSkeletonProps {
  itemCount?: number;
}

export const JournalSkeleton: React.FC<JournalSkeletonProps> = ({ 
  itemCount = 9 // 3 rangées de 3 cartes par défaut
}) => {
  const renderSkeletonCard = (index: number) => {
    const isLastInRow = (index + 1) % 3 === 0;
    
    return (
      <View 
        key={index}
        style={[
          styles.cardContainer,
          { width: CARD_WIDTH },
          isLastInRow && { marginRight: 0 }
        ]}
      >
        <View style={styles.card}>
          {/* Image skeleton */}
          <SkeletonLoader 
            width="100%" 
            height="100%" 
            borderRadius={8}
            style={styles.imageSkeleton}
          />
          
          {/* Contenu superposé */}
          <View style={styles.overlayContent}>
            {/* Stickers skeleton */}
            <View style={styles.stickersContainer}>
              <SkeletonLoader 
                width={24} 
                height={24} 
                borderRadius={12}
                style={styles.stickerSkeleton}
              />
              <SkeletonLoader 
                width={24} 
                height={24} 
                borderRadius={12}
                style={styles.stickerSkeleton}
              />
            </View>
            
            {/* Titre skeleton */}
            <SkeletonLoader 
              width="80%" 
              height={16} 
              borderRadius={4}
              style={styles.titleSkeleton}
            />
          </View>
        </View>
      </View>
    );
  };

  const renderSkeletonRows = () => {
    const rows = [];
    for (let i = 0; i < itemCount; i += 3) {
      const rowItems = [];
      for (let j = 0; j < 3 && (i + j) < itemCount; j++) {
        rowItems.push(renderSkeletonCard(i + j));
      }
      
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems}
        </View>
      );
    }
    return rows;
  };

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <SkeletonLoader 
          width={120} 
          height={32} 
          borderRadius={6}
          style={styles.titleSkeleton}
        />
        <View style={{ width: 44, height: 44 }} />
      </View>
      
      {/* Cards skeleton */}
      <View style={styles.workoutsList}>
        {renderSkeletonRows()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  workoutsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  cardContainer: {
    height: 120,
    marginBottom: 8,
    marginRight: GAP,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242526',
    position: 'relative',
  },
  imageSkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  stickersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  stickerSkeleton: {
    // Style déjà défini dans SkeletonLoader
  },
  titleSkeleton: {
    // Style déjà défini dans SkeletonLoader
  },
});
