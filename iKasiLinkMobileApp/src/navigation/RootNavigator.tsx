import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@theme/ThemeProvider';
import HomeScreen from '@screens/HomeScreen';
import EventsScreen from '@screens/EventsScreen';
import MessagesScreen from '@screens/MessagesScreen';
import ProfileScreen from '@screens/ProfileScreen';
import SplashScreen from '@screens/SplashScreen';
import LoginScreen from '@screens/LoginScreen';
import { useAuthStore } from '@state/authStore';
import { ENV } from '@config/env';
import WalletNavigator from './WalletNavigator';
import { Analytics } from '@analytics/index';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  Splash: undefined;
  Login: undefined;
  Wallet: undefined;
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
            Wallet: focused ? 'wallet' : 'wallet-outline',
          };
          return <Icon name={map[route.name] ?? 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      {ENV.walletV2Enabled && <Tab.Screen name="Wallet" component={WalletNavigator} />}
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const hydrated = useAuthStore(s => s.hydrated);
  const token = useAuthStore(s => s.accessToken);
  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['ikasilink://', 'https://ikasilink.app'],
    config: {
      screens: {
        MainTabs: {
          screens: {
            Home: 'home',
            Events: 'events',
            Messages: 'messages',
            Profile: 'profile',
          },
        },
      },
    },
  };
  return (
    <NavigationContainer linking={linking} theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator screenListeners={{ state: (e) => {
        const route = e?.data?.state?.routes?.[e?.data?.state?.index ?? 0];
        if (route?.name) Analytics.trackScreen(route.name.toString());
      }}}>
        {!hydrated ? (
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        ) : token ? (
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

