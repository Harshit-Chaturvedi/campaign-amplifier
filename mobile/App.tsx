import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
  Newsreader_700Bold,
} from '@expo-google-fonts/newsreader';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { RootNavigator } from './src/navigation/RootNavigator';

if (process.env.NODE_ENV !== 'test') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [timedOut, setTimedOut] = React.useState(false);

  useEffect(() => {
    // 3 second safety timeout so app always renders even if Google Fonts CDN is unreachable
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const isReady = Boolean(fontsLoaded || fontError || timedOut);

  useEffect(() => {
    if (isReady && process.env.NODE_ENV !== 'test') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  if (!isReady && process.env.NODE_ENV !== 'test') {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
