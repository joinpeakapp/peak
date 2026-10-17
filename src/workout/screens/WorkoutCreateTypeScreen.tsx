import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutCreateTypeScreenProps {
  onSelectCustom: () => void;
  onSelectTemplate: () => void;
  onClose: () => void;
}

export const WorkoutCreateTypeScreen: React.FC<WorkoutCreateTypeScreenProps> = ({
  onSelectCustom,
  onSelectTemplate,
  onClose
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        testID="close-button"
        style={styles.closeButton} 
        onPress={onClose}
      >
        <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create a workout</Text>
          <Text style={styles.subtitle}>Choose how you want to start your workout</Text>
        </View>

        <View style={styles.optionsContainer}>
          {/* Option Custom Workout */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={onSelectCustom}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="add-circle" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Custom workout</Text>
              <Text style={styles.optionDescription}>
                Build your own workout from scratch
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Option Template Workout */}
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={onSelectTemplate}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Ionicons name="list" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Choose a template</Text>
              <Text style={styles.optionDescription}>
                Start with a pre-made workout
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    padding: 8,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  titleContainer: {
    alignItems: 'flex-start',
    paddingTop: 32,
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
