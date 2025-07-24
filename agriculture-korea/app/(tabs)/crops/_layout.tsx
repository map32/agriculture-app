import { Stack } from "expo-router";
// This is the default configuration
export default function StackLayout() {
  return <Stack screenOptions={{
              // Hide the header for all other routes.
              headerShown: false,
            }}/>;
}
