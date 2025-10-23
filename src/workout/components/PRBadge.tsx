import React from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';

interface PRBadgeProps {
  type: 'weight' | 'reps';
  value?: number;
  previousValue?: number;
  style?: ViewStyle;
}

/**
 * Badge affichant un nouveau record personnel.
 * Peut être de type 'weight' (nouveau record de poids) ou 'reps' (nouveau record de répétitions).
 * Le badge reste affiché en permanence sur l'input correspondant.
 */
export const PRBadge: React.FC<PRBadgeProps> = ({
  type,
  value,
  previousValue,
  style
}) => {
  // Calcul de la différence pour les répétitions
  const repsDiff = previousValue && value ? value - previousValue : null;
  
  return (
    <View style={[
      styles.container,
      type === 'weight' ? styles.weightBadge : styles.repsBadge,
      style
    ]}>
      {type === 'weight' ? (
        <Text style={styles.weightText}>NEW PR</Text>
      ) : (
        <Text style={styles.repsText}>
          +{repsDiff || 1}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10, // Assurer que le badge est au-dessus des autres éléments
  },
  weightBadge: {
    backgroundColor: '#9B93E4', // Couleur violet pour les records de poids
  },
  repsBadge: {
    backgroundColor: '#FFD54D', // Couleur jaune doré pour les records de répétitions
  },
  weightText: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 12,
  },
  repsText: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 12,
  }
}); 