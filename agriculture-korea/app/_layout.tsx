import { Stack } from "expo-router";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function RootLayout() {
  return <Stack screenOptions={{
              // Hide the header for all other routes.
              headerShown: false,
            }}/>;
}
