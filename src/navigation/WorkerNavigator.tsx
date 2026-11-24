import { LegalScreen } from '../screens/shared/LegalScreen';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, Search, FileCheck2, MessageCircle, User } from '../components/ui/icons';
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '../api/inboxApi';
import { queryKeys } from '../api/keys';
import { WorkerTabParamList, WorkerStackParamList } from './types';
import { WorkerHomeScreen } from '../screens/worker/WorkerHomeScreen';
import { FindJobsScreen } from '../screens/worker/FindJobsScreen';
import { ApplicationsScreen } from '../screens/worker/ApplicationsScreen';
import { SavedJobsScreen } from '../screens/worker/SavedJobsScreen';
import { WorkerProfileScreen } from '../screens/worker/WorkerProfileScreen';
import { JobDetailScreen } from '../screens/worker/JobDetailScreen';
import { ApplicationDetailScreen } from '../screens/worker/ApplicationDetailScreen';
import { CompaniesScreen } from '../screens/worker/CompaniesScreen';
import { CompanyDetailScreen } from '../screens/worker/CompanyDetailScreen';
import { HelpScreen } from '../screens/shared/HelpScreen';
import { InboxScreen, MessagesTabScreen } from '../screens/shared/InboxScreen';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { TabBar } from '../components/layout/TabBar';
import { useLiveChat } from '../api/liveChat';

const Tab = createBottomTabNavigator<WorkerTabParamList>();
const Stack = createNativeStackNavigator<WorkerStackParamList>();

const WorkerTabs: React.FC = () => {
  // Live chat updates while logged in (new messages, typing, seen ticks).
  useLiveChat();
  // Unread chat messages show as a badge on the Messages tab.
  const threads = useQuery({ queryKey: [...queryKeys.messages.threads, 'worker'], queryFn: () => inboxApi.threads('worker') });
  const unread = (threads.data ?? []).reduce((sum, th) => sum + th.unread, 0);

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="WorkerHome"
        component={WorkerHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <Home size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="FindJobs"
        component={FindJobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, focused }) => <Search size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          tabBarLabel: 'Applied',
          tabBarIcon: ({ color, focused }) => <FileCheck2 size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesTabScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unread || undefined,
          tabBarIcon: ({ color, focused }) => <MessageCircle size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="WorkerProfile"
        component={WorkerProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <User size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
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
      <Stack.Screen name="SavedJobs" component={SavedJobsScreen} />
      <Stack.Screen name="Companies" component={CompaniesScreen} />
      <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
      <Stack.Screen name="ChatThread" component={ChatScreen} />
      <Stack.Screen name="Inbox" component={InboxScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};
