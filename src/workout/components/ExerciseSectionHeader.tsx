import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ExerciseSectionHeaderProps {
  letter: string;
}

/**
 * Composant pour afficher un header de section alphabétique
 * dans la liste d'exercices
 */
export const ExerciseSectionHeader: React.FC<ExerciseSectionHeaderProps> = ({ letter }) => {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{letter}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

