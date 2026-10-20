import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToLogin(message = 'Please sign in again') {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Login' as any, { message });
  }
}

export function navigateToHome() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Main' as any, {
      screen: 'HomeTab',
      params: { screen: 'Home' },
    });
  }
}
