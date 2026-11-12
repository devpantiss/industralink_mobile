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
import { LayoutGrid, BadgeCheck, Flag, Users, Briefcase, ScrollText, Shield, Settings, LogOut } from 'lucide-react-native';
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
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const Drawer = createDrawerNavigator<AdminDrawerParamList>();

const CustomAdminDrawer: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors } = useUiStore();
  const { logout } = useAuthStore();

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface }]}>
      <View style={[styles.drawerHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.shieldBox, { backgroundColor: colors.primarySoft }]}>
          <Shield size={24} color={colors.primary} />
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
          drawerIcon: ({ color, size }) => <LayoutGrid size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="VerificationsQueue"
        component={VerificationsQueueScreen}
        options={{
          drawerLabel: 'Company approvals',
          drawerIcon: ({ color, size }) => <BadgeCheck size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerLabel: 'Reports & help',
          drawerIcon: ({ color, size }) => <Flag size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="UsersManagement"
        component={UsersManagementScreen}
        options={{
          drawerLabel: 'Users',
          drawerIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="JobsModeration"
        component={AdminJobsScreen}
        options={{
          drawerLabel: 'Jobs',
          drawerIcon: ({ color, size }) => <Briefcase size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="ActivityLog"
        component={ActivityLogScreen}
        options={{
          drawerLabel: 'Activity log',
          drawerIcon: ({ color, size }) => <ScrollText size={size - 2} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color, size }) => <Settings size={size - 2} color={color} />,
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
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
    borderBottomWidth: 1,
  },
  shieldBox: {
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

