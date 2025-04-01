import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutsScreen } from '../workout/screens/WorkoutsScreen';

const Tab = createBottomTabNavigator();

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
          tabBarActiveTintColor: '#FF8A24',
          tabBarInactiveTintColor: '#5B5B5C',
          headerStyle: {
            backgroundColor: '#0D0D0F',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Workouts"
          component={WorkoutsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" size={size} color={color} />
            ),
          }}
        />
        {/* Autres onglets à ajouter ici */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 