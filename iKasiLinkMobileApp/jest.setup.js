// Jest setup for React Native
import '@testing-library/jest-native/extend-expect';
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
jest.mock('react-native-image-picker', () => ({ launchImageLibrary: jest.fn(() => Promise.resolve({ assets: [] })) }));
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  const makeEmitter = () => ({ addListener: jest.fn(), removeListeners: jest.fn() });
  return {
    ...RN,
    BackHandler: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
      exitApp: jest.fn(),
    },
    useColorScheme: jest.fn(() => 'light'),
    NativeModules: {
      ...RN.NativeModules,
      SettingsManager: { settings: { AppleLocale: 'en_US', AppleLanguages: ['en-US'] }, ...makeEmitter() },
      DevSettings: { ...makeEmitter() },
      PushNotificationManager: { ...makeEmitter() },
      Appearance: { ...makeEmitter() },
    },
    Clipboard: { setString: jest.fn(), getString: jest.fn().mockResolvedValue('') },
    ProgressBarAndroid: jest.fn(() => null),
  };
});

// Mock Settings TurboModule to satisfy react-native internals
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  getConstants: () => ({ settings: { AppleLocale: 'en_US', AppleLanguages: ['en-US'] } }),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));

