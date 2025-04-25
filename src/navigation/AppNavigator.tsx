import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutsScreen } from '../workout/screens/WorkoutsScreen';
import { JournalScreen } from '../workout/screens/JournalScreen';
import { WorkoutSummaryScreen } from '../workout/screens/WorkoutSummaryScreen';
import { WorkoutPhotoScreen } from '../workout/screens/WorkoutPhotoScreen';
import { WorkoutOverviewScreen } from '../workout/screens/WorkoutOverviewScreen';
import {
  WorkoutStackParamList,
  JournalStackParamList,
  ProfileStackParamList,
  RootStackParamList,
  SummaryStackParamList,
  MainTabParamList
} from '../types/navigation';
import { View, Text } from 'react-native';

// Écran temporaire pour le profil
const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0D0F' }}>
    <Text style={{ color: '#FFFFFF', fontSize: 24 }}>Profil</Text>
  </View>
);

// Création des navigateurs
const Tab = createBottomTabNavigator<MainTabParamList>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParamList>();
const JournalStack = createNativeStackNavigator<JournalStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const SummaryStack = createNativeStackNavigator<SummaryStackParamList>();

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
    <JournalStack.Screen name="Journal" component={JournalScreen} />
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
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
  </ProfileStack.Navigator>
);

// Navigateur pour le récapitulatif d'entraînement
const SummaryNavigator = () => {
  return (
    <SummaryStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#191A1D' }
      }}
    >
      <SummaryStack.Screen 
        name="WorkoutSummary" 
        component={WorkoutSummaryScreen} 
      />
      <SummaryStack.Screen 
        name="WorkoutPhoto" 
        component={WorkoutPhotoScreen} 
      />
      <SummaryStack.Screen 
        name="WorkoutOverview" 
        component={WorkoutOverviewScreen} 
      />
    </SummaryStack.Navigator>
  );
};

// Fonction pour déterminer si la navbar doit être visible selon l'état de navigation
const getTabBarVisibility = (route: any) => {
  // Liste des écrans qui doivent masquer la navbar
  const hiddenTabBarScreens = [
    'WorkoutDetail', 
    'WorkoutEdit', 
    'ExerciseDetail',
    'ExercisesList',
    'WorkoutSummary'
  ];

  // Vérifier si l'état de navigation contient une route actuelle
  if (route.state && route.state.routes) {
    const currentRouteName = route.state.routes[route.state.index]?.name;
    // Si la route actuelle est dans la liste des écrans à masquer
    if (hiddenTabBarScreens.includes(currentRouteName)) {
      return false;
    }
  }

  // Par défaut, afficher la barre
  return true;
};

// Navigateur principal avec tabs
const MainTabNavigator = () => {
  return (
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
  );
};

// Navigation principale de l'application
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0F' },
        }}
      >
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        <RootStack.Screen 
          name="SummaryFlow" 
          component={SummaryNavigator}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: '#0D0D0F' },
            gestureEnabled: false
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}; 