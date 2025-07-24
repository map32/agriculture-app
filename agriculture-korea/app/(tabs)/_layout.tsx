import { AntDesign, Feather, FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, Tabs } from "expo-router";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});
export default function TabLayout() {
    const insets = useSafeAreaInsets();
  return (
    <Tabs

      screenOptions={{
        tabBarInactiveTintColor: 'rgba(23, 190, 126, 1)',
        tabBarActiveTintColor: 'rgba(6, 172, 108, 1)',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: 'rgba(23, 190, 126, 1)',
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
          height: insets.bottom + 60
        },
        headerShown: false
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
      }}
      
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <AntDesign name="slack" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <FontAwesome name="map-marker" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="crops"
        options={{
          title: 'Crops',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="corn" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <Feather name="file-text" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
