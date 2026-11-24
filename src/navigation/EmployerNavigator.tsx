import { LegalScreen } from '../screens/shared/LegalScreen';
import { useLiveChat } from '../api/liveChat';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../theme/effects';
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../components/ui/Text';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { employerApi } from '../api/employerApi';
import { queryKeys } from '../api/keys';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserSearch,
  MessageCircle,
  PlusCircle,
  Building,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from '../components/ui/icons';
import { EmployerTabParamList, EmployerDrawerParamList, EmployerStackParamList } from './types';
import { EmployerHomeScreen } from '../screens/employer/EmployerHomeScreen';
import { EmployerJobsScreen } from '../screens/employer/EmployerJobsScreen';
import { CandidatesScreen } from '../screens/employer/CandidatesScreen';
import { FindWorkersScreen } from '../screens/employer/FindWorkersScreen';
import { PostJobWizardScreen } from '../screens/employer/PostJobWizardScreen';
import { CandidateDossierScreen } from '../screens/employer/CandidateDossierScreen';
import { JobApplicantsScreen } from '../screens/employer/JobApplicantsScreen';
import { HelpScreen } from '../screens/shared/HelpScreen';
import { InboxScreen, MessagesTabScreen } from '../screens/shared/InboxScreen';
import { inboxApi } from '../api/inboxApi';
import { ChatScreen } from '../screens/shared/ChatScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { CompanyProfileScreen } from '../screens/employer/CompanyProfileScreen';
import { AnalyticsScreen } from '../screens/employer/AnalyticsScreen';
import { useUiStore } from '../store/uiStore';
import { TabBar } from '../components/layout/TabBar';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator<EmployerTabParamList>();
const Drawer = createDrawerNavigator<EmployerDrawerParamList>();
const Stack = createNativeStackNavigator<EmployerStackParamList>();

const EmployerTabs: React.FC = () => {
  // Live chat updates while logged in (new messages, typing, seen ticks).
  useLiveChat();
  // New applicants show as a badge on the Candidates tab.
  const summary = useQuery({ queryKey: queryKeys.employer.summary, queryFn: () => employerApi.getSummary() });
  const threads = useQuery({ queryKey: [...queryKeys.messages.threads, 'employer'], queryFn: () => inboxApi.threads('employer') });
  const unread = (threads.data ?? []).reduce((sum, th) => sum + th.unread, 0);

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="EmployerDashboard"
        component={EmployerHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <LayoutDashboard size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="EmployerJobs"
        component={EmployerJobsScreen}
        options={{
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, focused }) => <Briefcase size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tab.Screen
        name="Candidates"
        component={CandidatesScreen}
        options={{
          tabBarLabel: 'Candidates',
          tabBarBadge: summary.data?.newApplicants || undefined,
          tabBarIcon: ({ color, focused }) => <Users size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
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
        name="FindWorkers"
        component={FindWorkersScreen}
        options={{
          tabBarLabel: 'Workers',
          tabBarIcon: ({ color, focused }) => <UserSearch size={22} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Tab.Navigator>
  );
};

const CustomDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, theme } = useUiStore();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border, paddingTop: insets.top + spacing.lg }]}>
        <LinearGradient colors={gradients[theme].night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.companyAvatar}>
          <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Building size={22} color="#FFFFFF" weight="fill" />
        </View>
        <Text style={[typography.h3, { color: colors.ink, fontWeight: '700' }]}>
          {user?.companyName || 'Your company'}
        </Text>
        <Text style={[typography.caption, { color: colors.inkSecondary }]}>
          Employer · Verified company
        </Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerItems}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Post a new job"
          icon={({ color, size }) => <PlusCircle size={size - 2} color={color} />}
          inactiveTintColor={colors.ink}
          labelStyle={{ fontSize: 14, fontWeight: '600' }}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.getParent()?.navigate('PostJobWizard');
          }}
        />
      </DrawerContentScrollView>

      <View style={[styles.drawerFooter, { borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={colors.dangerFg} />
          <Text style={[typography.body, { color: colors.dangerFg, fontWeight: '600', marginLeft: 8 }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const EmployerDrawer: React.FC = () => {
  const { colors } = useUiStore();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.ink,
        drawerActiveBackgroundColor: colors.primarySoft,
        drawerItemStyle: { borderRadius: 14, marginHorizontal: 10 },
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}
    >
      <Drawer.Screen
        name="EmployerMain"
        component={EmployerTabs}
        options={{
          drawerLabel: 'Overview',
          drawerIcon: ({ color, size, focused }) => <LayoutDashboard size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="Company"
        component={CompanyProfileScreen}
        options={{
          drawerLabel: 'Company profile',
          drawerIcon: ({ color, size, focused }) => <Building2 size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          drawerLabel: 'Analytics',
          drawerIcon: ({ color, size, focused }) => <BarChart3 size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'App Settings',
          drawerIcon: ({ color, size, focused }) => <Settings size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Drawer.Navigator>
  );
};

export const EmployerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="EmployerDrawer" component={EmployerDrawer} />
    <Stack.Screen name="CandidateDossier" component={CandidateDossierScreen} />
    <Stack.Screen name="JobApplicants" component={JobApplicantsScreen} />
    <Stack.Screen name="Inbox" component={InboxScreen} />
    <Stack.Screen name="Help" component={HelpScreen} />
    <Stack.Screen name="Legal" component={LegalScreen} />
    <Stack.Screen name="ChatThread" component={ChatScreen} />
    <Stack.Screen
      name="PostJobWizard"
      component={PostJobWizardScreen}
      options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
    />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  drawerHeader: {
    overflow: 'hidden',
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    borderBottomWidth: 1,
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  drawerItems: {
    paddingTop: spacing.sm,
  },
  drawerFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
