import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock react-native
jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');

  // Mock BackHandler
  rn.BackHandler = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  };

  // Mock useColorScheme
  rn.useColorScheme = jest.fn().mockReturnValue('light');

  return rn;
});
