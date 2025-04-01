import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WorkoutListScreen } from '../screens/WorkoutListScreen';
import { CreateWorkoutScreen } from '../screens/CreateWorkoutScreen';
import { WorkoutDetailScreen } from '../screens/WorkoutDetailScreen';

export type RootStackParamList = {
  WorkoutList: undefined;
  CreateWorkout: undefined;
  WorkoutDetail: { workoutId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="WorkoutList"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="WorkoutList" 
          component={WorkoutListScreen} 
          options={{ title: 'My Workouts' }}
        />
        <Stack.Screen 
          name="CreateWorkout" 
          component={CreateWorkoutScreen} 
          options={{ title: 'New Workout' }}
        />
        <Stack.Screen 
          name="WorkoutDetail" 
          component={WorkoutDetailScreen} 
          options={{ title: 'Workout Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 