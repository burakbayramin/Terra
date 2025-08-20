import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";
import { useOnboarding } from "@/hooks/useOnboarding";
import OnboardingCarousel from "@/components/OnboardingCarousel";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { shouldShowOnboarding, markOnboardingCompleted, isLoading } = useOnboarding();

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  // Show onboarding for new users
  if (shouldShowOnboarding()) {
    return (
      <OnboardingCarousel onComplete={markOnboardingCompleted} />
    );
  }

  // Show loading while checking onboarding status
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="whistle" options={{ headerShown: false }} />
      <Stack.Screen name="first-aid" options={{ headerShown: false }} />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="risk-form"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="earthquake-risk-analyzer"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="developer-support"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="premium-packages"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="notification-settings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="create-notification-wizard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="emergency-notification"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
