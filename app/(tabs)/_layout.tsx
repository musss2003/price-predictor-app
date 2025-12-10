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
        {/* Default second tab from Expo template, you can remove later if you want */}
        <Tabs.Screen
          name="two"
          options={{
            title: "Tab Two",
            tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          }}
        />
      </Tabs>
    </PredictionHistoryProvider>
  );
}
