import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Workout } from '../types/workout';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { theme } from '../constants/theme';

type WorkoutListScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WorkoutList'>;
};

const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No workouts yet</Text>
    <Text style={styles.emptySubText}>Start your fitness journey today!</Text>
  </View>
);

const WorkoutCard = ({ workout, onPress }: { workout: Workout; onPress: () => void }) => (
  <Card onPress={onPress} variant="elevated">
    <Text style={styles.workoutName}>{workout.name}</Text>
    <Text style={styles.workoutDate}>
      {new Date(workout.date).toLocaleDateString()}
    </Text>
    <Text style={styles.workoutDuration}>
      {workout.duration} minutes
    </Text>
  </Card>
);

export const WorkoutListScreen: React.FC<WorkoutListScreenProps> = ({ navigation }) => {
  // This would come from your state management solution
  const workouts: Workout[] = [];

  const handleCreateWorkout = () => {
    navigation.navigate('CreateWorkout');
  };

  const handleWorkoutPress = (workoutId: string) => {
    navigation.navigate('WorkoutDetail', { workoutId });
  };

  return (
    <SafeAreaView style={styles.container}>
      {workouts.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => handleWorkoutPress(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <View style={styles.fabContainer}>
        <Button
          title="+"
          onPress={handleCreateWorkout}
          size="large"
          style={styles.fab}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  emptySubText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  workoutName: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  workoutDate: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  workoutDuration: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 0,
  },
}); 