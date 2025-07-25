import { useAuth } from "@/providers/AuthProvider";
import { Redirect, Stack } from "expo-router";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="whistle" options={{ headerShown: false }} />
      <Stack.Screen name="first-aid" options={{ headerShown: false }} />
      <Stack.Screen
        name="what-to-do-earthquake"
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen name='groupSelector' options={{headerShown: false}}/>
      <Stack.Screen
        name='post/[id]'
        options={{
          headerTitle: '',
          headerStyle: { backgroundColor: '#FF5700' },
          headerLeft: () => <AntDesign name="close" size={24} color="white" onPress={() => router.back()} />,
          headerRight: () =>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AntDesign name="search1" size={24} color="white" />
              <MaterialIcons name="sort" size={27} color="white" />
              <Entypo name="dots-three-horizontal" size={24} color="white" />
            </View>,
          animation: "slide_from_bottom"
        }} /> */}
    </Stack>
  );
}
