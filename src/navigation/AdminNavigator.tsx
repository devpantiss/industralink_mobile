import { InboxScreen } from '../screens/shared/InboxScreen';
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
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { LayoutGrid, BadgeCheck, Flag, Users, Briefcase, ScrollText, Shield, Settings, LogOut } from '../components/ui/icons';
import { AdminDrawerParamList } from './types';
import { VerificationsQueueScreen } from '../screens/admin/VerificationsQueueScreen';
import { UsersManagementScreen } from '../screens/admin/UsersManagementScreen';
import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AdminJobsScreen } from '../screens/admin/AdminJobsScreen';
import { ReportsScreen } from '../screens/admin/ReportsScreen';
import { ActivityLogScreen } from '../screens/admin/ActivityLogScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { useUiStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

const CustomAdminDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors, theme } = useUiStore();
  const { logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border, paddingTop: insets.top + spacing.lg }]}>
        <LinearGradient colors={gradients[theme].night} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.shieldBox}>
          <LinearGradient colors={gradients[theme].brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Shield size={24} color="#FFFFFF" weight="fill" />
        </View>
        <Text style={[typography.h2, { color: colors.ink, fontWeight: '700' }]}>
          Admin
        </Text>
        <Text style={[typography.caption, { color: colors.inkSecondary }]}>
          Approve companies, remove bad jobs
        </Text>
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerItems}>
        <DrawerItemList {...props} />
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

export const AdminNavigator: React.FC = () => {
  const { colors } = useUiStore();

  return (
    <Drawer.Navigator
      initialRouteName="AdminHome"
      drawerContent={(props) => <CustomAdminDrawer {...props} />}
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
        name="AdminHome"
        component={AdminHomeScreen}
        options={{
          drawerLabel: 'Dashboard',
          drawerIcon: ({ color, size, focused }) => <LayoutGrid size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="VerificationsQueue"
        component={VerificationsQueueScreen}
        options={{
          drawerLabel: 'Company approvals',
          drawerIcon: ({ color, size, focused }) => <BadgeCheck size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerLabel: 'Reports & help',
          drawerIcon: ({ color, size, focused }) => <Flag size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="UsersManagement"
        component={UsersManagementScreen}
        options={{
          drawerLabel: 'Users',
          drawerIcon: ({ color, size, focused }) => <Users size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="JobsModeration"
        component={AdminJobsScreen}
        options={{
          drawerLabel: 'Jobs',
          drawerIcon: ({ color, size, focused }) => <Briefcase size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="ActivityLog"
        component={ActivityLogScreen}
        options={{
          drawerLabel: 'Activity log',
          drawerIcon: ({ color, size, focused }) => <ScrollText size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Drawer.Screen
        name="Inbox"
        component={InboxScreen}
        options={{ drawerItemStyle: { display: 'none' } }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size, focused }) => <Settings size={size - 2} color={color} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Drawer.Navigator>
  );
};

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
  shieldBox: {
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

