import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutsScreen } from '../workout/screens/WorkoutsScreen';
import { WorkoutStackParamList, RootTabParamList } from '../types/navigation';
import { View, Text } from 'react-native';

// Composants temporaires pour les autres onglets
const JournalScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0F' }}>
    <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Journal</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0F' }}>
    <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Profile</Text>
  </View>
);

// Création des navigateurs
const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();

// Navigateur empilé pour les écrans liés aux workouts
const WorkoutStackNavigator = () => {
  return (
    <WorkoutStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <WorkoutStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
      {/* Ces écrans seront implémentés plus tard */}
      {/* <WorkoutStack.Screen 
        name="WorkoutCreation" 
        component={WorkoutCreationScreen}
      />
      <WorkoutStack.Screen 
        name="WorkoutFrequency" 
        component={WorkoutFrequencyScreen}
      />
      <WorkoutStack.Screen 
        name="WorkoutDetail" 
        component={WorkoutDetailScreen}
      /> */}
    </WorkoutStack.Navigator>
  );
};

// Navigateur principal avec onglets
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0D0D0F',
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
          },
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#5B5B5C',
        }}
      >
        <Tab.Screen
          name="Workouts"
          component={WorkoutStackNavigator}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Journal"
          component={JournalScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 