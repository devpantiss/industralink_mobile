import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserSearch,
  PlusCircle,
  Building,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { EmployerTabParamList, EmployerDrawerParamList, EmployerStackParamList } from './types';
import { EmployerHomeScreen } from '../screens/employer/EmployerHomeScreen';
import { EmployerJobsScreen } from '../screens/employer/EmployerJobsScreen';
import { CandidatesScreen } from '../screens/employer/CandidatesScreen';
import { FindWorkersScreen } from '../screens/employer/FindWorkersScreen';
import { PostJobWizardScreen } from '../screens/employer/PostJobWizardScreen';
import { CandidateDossierScreen } from '../screens/employer/CandidateDossierScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const Tab = createBottomTabNavigator<EmployerTabParamList>();
const Drawer = createDrawerNavigator<EmployerDrawerParamList>();
const Stack = createNativeStackNavigator<EmployerStackParamList>();

const EmployerTabs: React.FC = () => {
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
        name="EmployerDashboard"
        component={EmployerHomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="EmployerJobs"
        component={EmployerJobsScreen}
        options={{
          tabBarLabel: 'My Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="Candidates"
        component={CandidatesScreen}
        options={{
          tabBarLabel: 'Candidates',
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Tab.Screen
        name="FindWorkers"
        component={FindWorkersScreen}
        options={{
          tabBarLabel: 'Find Workers',
          tabBarIcon: ({ color, size }) => <UserSearch size={size - 2} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const CustomDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors } = useUiStore();
  const { user, logout } = useAuthStore();

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.companyAvatar, { backgroundColor: colors.primarySoft }]}>
          <Building size={22} color={colors.primary} />
        </View>
        <Text style={[typography.h3, { color: colors.ink, fontWeight: '700' }]}>
          {user?.companyName || 'National Heavy Engineering'}
        </Text>
        <Text style={[typography.caption, { color: colors.inkSecondary }]}>
          Employer Portal • Verified Recruiter
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

      <View style={[styles.drawerFooter, { borderTopColor: colors.border }]}>
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
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'App Settings',
          drawerIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

export const EmployerNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="EmployerDrawer" component={EmployerDrawer} />
    <Stack.Screen name="CandidateDossier" component={CandidateDossierScreen} />
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
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    borderBottomWidth: 1,
  },
  companyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
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
