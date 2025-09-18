import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { AuthApi } from '@api/modules';
import { useAuthStore } from '@state/authStore';

export default function LoginScreen(): React.JSX.Element {
  const theme = useTheme();
  const setAccessToken = useAuthStore(s => s.setAccessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    try {
      setLoading(true);
      const res = await AuthApi.login({ email, password });
      const token: string | undefined = res?.data?.token;
      if (!token) throw new Error('Missing token');
      await setAccessToken(token);
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.form}>
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Sign in</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity disabled={loading} onPress={onLogin} style={[styles.button, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, justifyContent: 'center' },
  form: { gap: 12 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  button: { marginTop: 8, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});

