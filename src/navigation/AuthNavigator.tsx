import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpVerifyScreen } from '../screens/auth/OtpVerifyScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { WorkerWelcomeScreen } from '../screens/auth/WorkerWelcomeScreen';
import { EmployerWelcomeScreen } from '../screens/auth/EmployerWelcomeScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="WorkerWelcome" component={WorkerWelcomeScreen} />
      <Stack.Screen name="EmployerWelcome" component={EmployerWelcomeScreen} />
    </Stack.Navigator>
  );
};
