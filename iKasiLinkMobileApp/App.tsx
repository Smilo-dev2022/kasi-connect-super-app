/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import RootNavigator from '@navigation/RootNavigator';
import ThemeProvider from '@theme/ThemeProvider';

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
