import { Tabs } from "expo-router";
import {
  Foundation,
  Entypo,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { eventEmitter } from "@/lib/eventEmitter";

// Custom Tab Bar Component for Double Tap
const CustomTabBarButton = ({ 
  children, 
  onPress, 
  onDoublePress, 
  ...props 
}: {
  children: React.ReactNode;
  onPress: () => void;
  onDoublePress: () => void;
  [key: string]: any;
}) => {
  const [lastTap, setLastTap] = useState(0);
  const tapTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      onDoublePress();
    } else {
      // Single tap
      tapTimeout.current = setTimeout(() => {
        onPress();
      }, DOUBLE_PRESS_DELAY);
    }
    setLastTap(now);
  };

  return (
    <TouchableOpacity onPress={handlePress} {...props}>
      {children}
    </TouchableOpacity>
  );
};

// TODO zustand eklendiginde scrollaninca tabbar kaybolacak yukari kaydirinca geri gelecek
export default function TabLayout() {
  const router = useRouter();

  const handleEarthquakesDoubleTap = () => {
    // Navigate to earthquakes index (list view)
    router.push("/(protected)/(tabs)/earthquakes");
  };

  const handleHomeDoubleTap = () => {
    // Emit event for home double-tap
    eventEmitter.emit('homeDoubleTap');
  };

  return (
    <Tabs>
      <Tabs.Screen
        name="news"
        options={{
          title: "Haberler",
          headerTitle: "Haberler",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <Entypo name="news" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analyzer"
        options={{
          title: "AI",
          headerTitle: "AI",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="brain" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          headerTitle: "Terra",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
            color: colors.primary,
            fontSize: 30,
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <Foundation name="home" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onDoublePress={handleHomeDoubleTap}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earthquakes"
        options={{
          title: "Depremler",
          headerTitle: "Depremler",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <Foundation name="list" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              onDoublePress={handleEarthquakesDoubleTap}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="earthquake-stats"
        options={{
          title: "İstatistikler",
          headerTitle: "Deprem İstatistikleri",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <Ionicons name="stats-chart" size={24} color={color} />
          ),
        }}
      />
      {/* <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
          headerShown: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: "NotoSans-Bold",
          },
          headerTintColor: colors.light.textPrimary,
          tabBarActiveTintColor: colors.light.textPrimary,
          tabBarInactiveTintColor: colors.light.textSecondary,
          tabBarIcon: ({ color }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
      /> */}
    </Tabs>
  );
}
