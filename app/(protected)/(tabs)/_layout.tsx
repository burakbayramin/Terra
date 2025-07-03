import { Tabs } from "expo-router";
import {
  Foundation,
  Entypo,
  MaterialCommunityIcons,
  FontAwesome,
  FontAwesome6,
} from "@expo/vector-icons";
import { colors } from "@/constants/colors";

// TODO zustand eklendiginde scrollaninca tabbar kaybolacak yukari kaydirinca geri gelecek
export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="news"
        options={{
          title: "News",
          headerTitle: "News",
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
          title: "Analyzer",
          headerTitle: "Analyzer",
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
          title: "Home",
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
        }}
      />
      <Tabs.Screen
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
      />
    </Tabs>
  );
}
