import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExerciseCreateCategoriesScreenProps {
  onComplete: (tags: string[]) => void;
  onBack: () => void;
}

// Tags disponibles
const AVAILABLE_TAGS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
  'Cardio',
  'Upper Body',
  'Lower Body',
];

export const ExerciseCreateCategoriesScreen: React.FC<ExerciseCreateCategoriesScreenProps> = ({
  onComplete,
  onBack
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleComplete = () => {
    onComplete(selectedTags);
  };

  const canComplete = selectedTags.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title and subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Create an exercise</Text>
          <Text style={styles.subtitle}>
            Which muscles does it work?{selectedTags.length > 0 && ` (${selectedTags.length} selected)`}
          </Text>
        </View>

        {/* Tags */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.tagsContainer}>
            {AVAILABLE_TAGS.map(tag => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tag, isSelected && styles.tagSelected]}
                  onPress={() => toggleTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                    {tag}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color="#0D0D0F" style={styles.tagCheck} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Create Button */}
        <TouchableOpacity 
          style={[styles.createButton, !canComplete && styles.createButtonDisabled]} 
          onPress={handleComplete}
          disabled={!canComplete}
        >
          <Ionicons name="add-circle" size={20} color="#0D0D0F" />
          <Text style={styles.createButtonText}>Create Exercise</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0F',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242526',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#5B5B5C',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    marginTop: 32,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tagSelected: {
    backgroundColor: '#FFFFFF',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tagTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
  tagCheck: {
    marginLeft: 2,
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 48,
  },
  createButtonDisabled: {
    backgroundColor: '#2A2A2D',
    opacity: 0.5,
  },
  createButtonText: {
    color: '#0D0D0F',
    fontSize: 16,
    fontWeight: '600',
  },
});

