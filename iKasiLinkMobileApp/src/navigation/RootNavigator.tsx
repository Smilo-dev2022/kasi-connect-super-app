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
import KycIntroScreen from '@screens/Kyc/KycIntroScreen';
import KycIdScreen from '@screens/Kyc/KycIdScreen';
import KycSelfieScreen from '@screens/Kyc/KycSelfieScreen';
import KycAddressScreen from '@screens/Kyc/KycAddressScreen';
import KycConsentScreen from '@screens/Kyc/KycConsentScreen';
import KycResultScreen from '@screens/Kyc/KycResultScreen';
import { useAuthStore } from '@state/authStore';
import { Analytics } from '@analytics/index';

export type RootStackParamList = {
  MainTabs: undefined;
  Auth: undefined;
  Splash: undefined;
  Login: undefined;
  KycIntroScreen: undefined;
  KycIdScreen: undefined;
  KycSelfieScreen: undefined;
  KycAddressScreen: undefined;
  KycConsentScreen: undefined;
  KycResultScreen: undefined;
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
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="KycIntroScreen" component={KycIntroScreen} options={{ title: 'Identity Verification' }} />
            <Stack.Screen name="KycIdScreen" component={KycIdScreen} options={{ title: 'Scan ID' }} />
            <Stack.Screen name="KycSelfieScreen" component={KycSelfieScreen} options={{ title: 'Take Selfie' }} />
            <Stack.Screen name="KycAddressScreen" component={KycAddressScreen} options={{ title: 'Address' }} />
            <Stack.Screen name="KycConsentScreen" component={KycConsentScreen} options={{ title: 'Consent' }} />
            <Stack.Screen name="KycResultScreen" component={KycResultScreen} options={{ title: 'Result', headerShown: false }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

