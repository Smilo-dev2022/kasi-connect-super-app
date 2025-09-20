import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import MessagesScreen from '../src/screens/MessagesScreen';
import ThemeProvider from '@theme/ThemeProvider';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

describe('MessagesScreen', () => {
  it('renders correctly', () => {
    const component = (
      <NavigationContainer>
        <ThemeProvider>
          <MessagesScreen />
        </ThemeProvider>
      </NavigationContainer>
    );
    render(component);
  });
});
