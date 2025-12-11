import { Tabs } from "expo-router";
import { TabBarIcon } from "../../components/TabBarIcon";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { PredictionHistoryProvider } from "../../hooks/use-prediction-history";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <PredictionHistoryProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Predict",
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => <TabBarIcon name="time" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // Hide this tab from navigation
          }}
        />
      </Tabs>
    </PredictionHistoryProvider>
  );
}
