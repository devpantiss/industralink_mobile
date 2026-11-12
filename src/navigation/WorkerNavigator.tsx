import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, FileCheck2, Bookmark, User } from 'lucide-react-native';
import { WorkerTabParamList, WorkerStackParamList } from './types';
import { WorkerHomeScreen } from '../screens/worker/WorkerHomeScreen';
import { FindJobsScreen } from '../screens/worker/FindJobsScreen';
import { ApplicationsScreen } from '../screens/worker/ApplicationsScreen';
import { SavedJobsScreen } from '../screens/worker/SavedJobsScreen';
import { WorkerProfileScreen } from '../screens/worker/WorkerProfileScreen';
import { JobDetailScreen } from '../screens/worker/JobDetailScreen';
import { ApplicationDetailScreen } from '../screens/worker/ApplicationDetailScreen';
import { CompanyDetailScreen } from '../screens/worker/CompanyDetailScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { useUiStore } from '../store/uiStore';

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

const WorkerTabs: React.FC = () => {
  const { colors } = useUiStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="WorkerHome"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="FindJobs"
        component={FindJobsScreen}
        options={{
          tabBarLabel: 'Find Jobs',
          tabBarIcon: ({ color, size }) => <Search size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          tabBarLabel: 'Applied',
          tabBarIcon: ({ color, size }) => <FileCheck2 size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="SavedJobs"
        component={SavedJobsScreen}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => <Bookmark size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const WorkerNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="WorkerTabs" component={WorkerTabs} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
      <Stack.Screen name="ChatThread" component={ChatScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
