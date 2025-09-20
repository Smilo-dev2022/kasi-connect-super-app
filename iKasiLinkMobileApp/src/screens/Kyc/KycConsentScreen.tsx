import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';
import { api } from '@api/client';

const KycConsentScreen = () => {
  const navigation = useNavigation();
  const userId = useAuthStore(s => s.user?.id);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to submit.');
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/kyc/submit', { userId });
      (navigation as any).navigate('KycResultScreen');
    } catch (error) {
      console.error(error);
      Alert.alert('Submission Failed', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Consent</Text>
      <Text style={styles.text}>
        I consent to my information being used for verification purposes.
      </Text>
      <Button
        title={isLoading ? 'Submitting...' : 'Agree and Submit'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default KycConsentScreen;
