import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PersonalRecordBadgeProps {
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  withAnimation?: boolean;
}

/**
 * Badge affichant un record personnel.
 * Peut être utilisé de différentes tailles selon le contexte.
 */
export const PersonalRecordBadge: React.FC<PersonalRecordBadgeProps> = ({
  size = 'medium',
  style,
  withAnimation = false
}) => {
  // Calcul des tailles en fonction de la propriété size
  const getSize = () => {
    switch (size) {
      case 'small':
        return {
          container: { height: 20, paddingHorizontal: 6 },
          icon: 12,
          text: 10
        };
      case 'large':
        return {
          container: { height: 32, paddingHorizontal: 12 },
          icon: 20,
          text: 16
        };
      case 'medium':
      default:
        return {
          container: { height: 24, paddingHorizontal: 8 },
          icon: 16,
          text: 12
        };
    }
  };

  const sizeValues = getSize();

  return (
    <View style={[
      styles.container, 
      sizeValues.container,
      withAnimation && styles.animated,
      style
    ]}>
      <Ionicons 
        name="trophy" 
        size={sizeValues.icon} 
        color="#000" 
        style={styles.icon} 
      />
      <Text style={[styles.text, { fontSize: sizeValues.text }]}>PR</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9B93E4', // Couleur violet pour le badge PR
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 2,
  },
  text: {
    fontWeight: 'bold',
    color: '#000000',
  },
  animated: {
    // Animation pour mettre en évidence un nouveau PR
    shadowColor: '#9B93E4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  }
}); 