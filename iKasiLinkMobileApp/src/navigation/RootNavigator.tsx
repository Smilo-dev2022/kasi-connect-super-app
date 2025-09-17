import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@theme/ThemeProvider';
import HomeScreen from '@screens/HomeScreen';
import EventsScreen from '@screens/EventsScreen';
import MessagesScreen from '@screens/MessagesScreen';
import ProfileScreen from '@screens/ProfileScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs(): React.JSX.Element {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.tabBar },
        tabBarActiveTintColor: theme.colors.tabIconActive,
        tabBarInactiveTintColor: theme.colors.tabIconInactive,
        tabBarIcon: ({ color, size, focused }) => {
          const map: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Events: focused ? 'calendar' : 'calendar-outline',
            Messages: focused ? 'chatbubble' : 'chatbubble-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Icon name={map[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator(): React.JSX.Element {
  const colorScheme = useColorScheme();
  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

