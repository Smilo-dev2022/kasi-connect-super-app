import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { useAuthStore } from '@state/authStore';

export default function SplashScreen(): React.JSX.Element {
  const theme = useTheme();
  const hydrated = useAuthStore(s => s.hydrated);
  const loadFromKeychain = useAuthStore(s => s.loadFromKeychain);

  useEffect(() => {
    if (!hydrated) {
      loadFromKeychain();
    }
  }, [hydrated, loadFromKeychain]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

