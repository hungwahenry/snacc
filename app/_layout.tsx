/**
 * Root Layout for Snacc App
 * 
 * Main app layout with theme provider and navigation setup
 */

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AlertProvider, ToastProvider } from '../components/ui'
import 'react-native-reanimated'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            {/* Main authenticated app */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            
            {/* Authentication flow */}
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="auth/email" options={{ headerShown: false }} />
            <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
            
            {/* Onboarding flow */}
            <Stack.Screen name="onboarding/username" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/profile" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/interests" options={{ headerShown: false }} />
            
            {/* Error pages */}
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </Stack>
          
          <StatusBar style="auto" />
        </ToastProvider>
      </AlertProvider>
    </ThemeProvider>
  )
}