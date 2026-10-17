import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Exercise, WorkoutFrequency } from '../../types/workout';

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  exercises: Omit<Exercise, 'id'>[];
}

interface WorkoutCreateTemplateScreenProps {
  onSelectTemplate: (name: string, exercises: Omit<Exercise, 'id'>[], frequency: WorkoutFrequency) => void;
  onBack: () => void;
}

const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'push',
    name: 'Push Day',
    description: 'Chest, shoulders & triceps',
    exercises: [
      { name: 'Flat Bench Press', sets: 4, reps: 8, tracking: 'trackedOnSets', tags: ['Chest', 'Compound'] },
      { name: 'Overhead Press', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Shoulders', 'Compound'] },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Chest'] },
      { name: 'Lateral Raise', sets: 3, reps: 15, tracking: 'trackedOnSets', tags: ['Shoulders'] },
      { name: 'Tricep Dips', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Triceps'] },
      { name: 'Tricep Pushdown', sets: 3, reps: 15, tracking: 'trackedOnSets', tags: ['Triceps'] },
    ]
  },
  {
    id: 'pull',
    name: 'Pull Day',
    description: 'Back & biceps',
    exercises: [
      { name: 'Pull-up', sets: 4, reps: 8, tracking: 'trackedOnSets', tags: ['Back', 'Compound'] },
      { name: 'Bent Over Row', sets: 4, reps: 10, tracking: 'trackedOnSets', tags: ['Back', 'Compound'] },
      { name: 'Lat Pulldown', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Back'] },
      { name: 'Face Pull', sets: 3, reps: 15, tracking: 'trackedOnSets', tags: ['Back', 'Shoulders'] },
      { name: 'Barbell Curl', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Biceps'] },
      { name: 'Hammer Curl', sets: 3, reps: 15, tracking: 'trackedOnSets', tags: ['Biceps'] },
    ]
  },
  {
    id: 'legs',
    name: 'Leg Day',
    description: 'Quads, hamstrings & calves',
    exercises: [
      { name: 'Back Squat', sets: 4, reps: 8, tracking: 'trackedOnSets', tags: ['Legs', 'Compound'] },
      { name: 'Romanian Deadlift', sets: 4, reps: 10, tracking: 'trackedOnSets', tags: ['Legs', 'Compound'] },
      { name: 'Leg Press', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Legs'] },
      { name: 'Leg Curl', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Legs'] },
      { name: 'Leg Extension', sets: 3, reps: 15, tracking: 'trackedOnSets', tags: ['Legs'] },
      { name: 'Standing Calf Raise', sets: 4, reps: 20, tracking: 'trackedOnSets', tags: ['Legs'] },
    ]
  },
  {
    id: 'upper',
    name: 'Upper Body',
    description: 'Full upper body workout',
    exercises: [
      { name: 'Flat Bench Press', sets: 4, reps: 8, tracking: 'trackedOnSets', tags: ['Chest', 'Compound'] },
      { name: 'Pull-up', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Back', 'Compound'] },
      { name: 'Overhead Press', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Shoulders', 'Compound'] },
      { name: 'Bent Over Row', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Back', 'Compound'] },
      { name: 'Dumbbell Curl', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Biceps'] },
      { name: 'Tricep Dips', sets: 3, reps: 12, tracking: 'trackedOnSets', tags: ['Triceps'] },
    ]
  },
  {
    id: 'full-body',
    name: 'Full Body',
    description: 'Complete workout for all muscles',
    exercises: [
      { name: 'Back Squat', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Legs', 'Compound'] },
      { name: 'Flat Bench Press', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Chest', 'Compound'] },
      { name: 'Deadlift', sets: 3, reps: 8, tracking: 'trackedOnSets', tags: ['Back', 'Legs', 'Compound'] },
      { name: 'Overhead Press', sets: 3, reps: 10, tracking: 'trackedOnSets', tags: ['Shoulders', 'Compound'] },
      { name: 'Pull-up', sets: 3, reps: 8, tracking: 'trackedOnSets', tags: ['Back', 'Compound'] },
      { name: 'Plank', sets: 3, reps: 1, duration: 60, tracking: 'trackedOnTime', tags: ['Core'] },
    ]
  },
  {
    id: 'cardio',
    name: 'Cardio & Conditioning',
    description: 'Endurance and conditioning',
    exercises: [
      { name: 'Running', sets: 1, reps: 1, duration: 1800, tracking: 'trackedOnTime', tags: ['Cardio'] },
      { name: 'Jump Rope', sets: 3, reps: 1, duration: 180, tracking: 'trackedOnTime', tags: ['Cardio'] },
      { name: 'Burpees', sets: 4, reps: 15, tracking: 'trackedOnSets', tags: ['Cardio', 'Full Body'] },
      { name: 'Mountain Climber', sets: 4, reps: 20, tracking: 'trackedOnSets', tags: ['Cardio', 'Core'] },
      { name: 'High Knees', sets: 3, reps: 1, duration: 60, tracking: 'trackedOnTime', tags: ['Cardio'] },
    ]
  },
];

export const WorkoutCreateTemplateScreen: React.FC<WorkoutCreateTemplateScreenProps> = ({
  onSelectTemplate,
  onBack
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleTemplatePress = (template: WorkoutTemplate) => {
    setSelectedTemplateId(template.id);
    // Default frequency: flexible schedule
    const defaultFrequency: WorkoutFrequency = { type: 'none', value: 0 };
    onSelectTemplate(template.name, template.exercises, defaultFrequency);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        testID="back-button"
        style={styles.backButton} 
        onPress={onBack}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Choose a template</Text>
          <Text style={styles.subtitle}>Select a pre-made workout to get started quickly</Text>
        </View>

        <View style={styles.templatesContainer}>
          {WORKOUT_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.templateCard,
                selectedTemplateId === template.id && styles.templateCardSelected
              ]}
              onPress={() => handleTemplatePress(template)}
              activeOpacity={0.8}
            >
              <View style={styles.templateContent}>
                <Text style={styles.templateTitle}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
                <Text style={styles.templateExercises}>
                  {template.exercises.length} exercises
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={24} color="rgba(255, 255, 255, 0.6)" />
            </TouchableOpacity>
          ))}
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
  backButton: {
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
    marginBottom: 32,
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
  templatesContainer: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: 'rgba(36, 37, 38, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateCardSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(36, 37, 38, 0.8)',
  },
  templateContent: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  templateExercises: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
