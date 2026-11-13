import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { WorkerWelcomeScreen } from './WorkerWelcomeScreen';
import { EmployerWelcomeScreen } from './EmployerWelcomeScreen';

/** First-run setup for a new account. The root navigator shows it while `user.onboarded` is false. */
export const OnboardingScreen: React.FC = () => {
  const role = useAuthStore((s) => s.role);
  return role === 'employer' ? <EmployerWelcomeScreen /> : <WorkerWelcomeScreen />;
};
