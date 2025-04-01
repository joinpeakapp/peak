import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Workout } from '../types/workout';

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
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <Text style={styles.workoutName}>{workout.name}</Text>
    <Text style={styles.workoutDate}>{new Date(workout.date).toLocaleDateString()}</Text>
    <Text style={styles.workoutDuration}>{workout.duration} minutes</Text>
  </TouchableOpacity>
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
      <TouchableOpacity style={styles.fab} onPress={handleCreateWorkout}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f4511e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
  },
}); 