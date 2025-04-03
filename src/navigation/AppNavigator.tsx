import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutsScreen } from '../workout/screens/WorkoutsScreen';
import {
  WorkoutStackParamList,
  JournalStackParamList,
  ProfileStackParamList,
  RootTabParamList,
} from '../types/navigation';

// Écrans temporaires pour les autres onglets
import { View, Text } from 'react-native';

const JournalScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0F' }}>
    <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Journal</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0F' }}>
    <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Profil</Text>
  </View>
);

// Création des navigateurs
const Tab = createBottomTabNavigator<RootTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Navigateur pour les Workouts
const WorkoutNavigator = () => (
  <WorkoutStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0D0D0F' },
    }}
  >
    <WorkoutStack.Screen name="WorkoutsList" component={WorkoutsScreen} />
  </WorkoutStack.Navigator>
);

// Navigateur pour le Journal
const JournalNavigator = () => (
  <JournalStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0D0D0F' },
    }}
  >
    <JournalStack.Screen name="JournalList" component={JournalScreen} />
  </JournalStack.Navigator>
);

// Navigateur pour le Profil
const ProfileNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#0D0D0F' },
    }}
  >
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Fonction pour déterminer si la navbar doit être visible selon l'état de navigation
const getTabBarVisibility = (route: any) => {
  // Obtenir l'état de la navigation
  const routeName = route.state
    ? route.state.routes[route.state.index]?.name
    : route.params?.screen || 'WorkoutsList';

  // Liste des écrans qui doivent masquer la navbar
  const hiddenTabBarScreens = [
    'WorkoutDetail', 
    'WorkoutEdit', 
    'WorkoutCreate',
    'WorkoutCreateName',
    'WorkoutCreateFrequency',
    'JournalDetail',
    'JournalCreate',
    'ProfileEdit',
    'Settings',
  ];

  // Retourner la visibilité selon le nom de l'écran
  return hiddenTabBarScreens.includes(routeName) ? false : true;
};

// Navigateur principal avec tabs
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0D0D0F',
            borderTopColor: 'rgba(255, 255, 255, 0.05)',
            borderTopWidth: 1,
            elevation: 0,
            height: 100,
            paddingTop: 16,
            paddingBottom: 10,
          },
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        }}
        initialRouteName="WorkoutsTab"
      >
        <Tab.Screen
          name="WorkoutsTab"
          component={WorkoutNavigator}
          options={({ route }) => ({
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="barbell-outline" size={26} color={color} />
            ),
            tabBarStyle: {
              display: getTabBarVisibility(route) ? 'flex' : 'none',
              backgroundColor: '#0D0D0F',
              borderTopColor: 'rgba(255, 255, 255, 0.05)',
              borderTopWidth: 1,
              elevation: 0,
              height: 100,
              paddingTop: 16,
              paddingBottom: 10,
            },
          })}
        />
        <Tab.Screen
          name="JournalTab"
          component={JournalNavigator}
          options={({ route }) => ({
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={24} color={color} />
            ),
            tabBarStyle: {
              display: getTabBarVisibility(route) ? 'flex' : 'none',
              backgroundColor: '#0D0D0F',
              borderTopColor: 'rgba(255, 255, 255, 0.05)',
              borderTopWidth: 1,
              elevation: 0,
              height: 100,
              paddingTop: 16,
              paddingBottom: 10,
            },
          })}
        />
        <Tab.Screen
          name="ProfileTab"
          component={ProfileNavigator}
          options={({ route }) => ({
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={24} color={color} />
            ),
            tabBarStyle: {
              display: getTabBarVisibility(route) ? 'flex' : 'none',
              backgroundColor: '#0D0D0F',
              borderTopColor: 'rgba(255, 255, 255, 0.05)',
              borderTopWidth: 1,
              elevation: 0,
              height: 100,
              paddingTop: 16,
              paddingBottom: 10,
            },
          })}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}; 