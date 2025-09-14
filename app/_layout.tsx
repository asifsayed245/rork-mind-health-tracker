import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { Platform, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { trpc } from "@/lib/trpc";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";
import { AuthProvider, useAuth } from "@/stores/authStore";
import { CheckInProvider } from "@/stores/checkInStore";
import { JournalProvider } from "@/stores/journalStore";
import { UserProfileProvider } from "@/stores/userProfileStore";


SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
  },
  container: {
    flex: 1,
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="gratitude" options={{ presentation: "modal" }} />
      <Stack.Screen name="breathing" options={{ presentation: "modal" }} />
      <Stack.Screen name="reflection" options={{ presentation: "modal" }} />
    </Stack>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, loading, session } = useAuth();

  // Create tRPC client that updates when session changes
  const trpcClient = useMemo(() => {
    const getBaseUrl = () => {
      if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
        return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      }
      throw new Error("No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL");
    };

    return trpc.createClient({
      links: [
        httpLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers: async () => {
            try {
              // Use the session from auth context if available, otherwise get fresh session
              const currentSession = session || (await supabase.auth.getSession()).data.session;
              return {
                authorization: currentSession?.access_token ? `Bearer ${currentSession.access_token}` : '',
              };
            } catch (error) {
              console.error('Error getting session for tRPC headers:', error);
              return {
                authorization: '',
              };
            }
          },
        }),
      ],
    });
  }, [session]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <UserProfileProvider>
        <CheckInProvider>
          <JournalProvider>
            <RootLayoutNav />
          </JournalProvider>
        </CheckInProvider>
      </UserProfileProvider>
    </trpc.Provider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  const GestureWrapper = Platform.OS === 'web' ? View : GestureHandlerRootView;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureWrapper style={styles.container}>
          <StatusBar style="light" />
          <AuthenticatedApp />
        </GestureWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}