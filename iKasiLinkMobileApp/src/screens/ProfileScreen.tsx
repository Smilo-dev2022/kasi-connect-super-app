import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, Button, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@state/authStore';
import { api } from '@api/client';

interface KycStatus {
  status: 'NOT_STARTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
}

function KycStatusCard() {
  const navigation = useNavigation();
  const userId = useAuthStore(s => s.user?.id);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.get<KycStatus>(`/kyc/status/${userId}`)
      .then(response => setKycStatus(response.data))
      .catch(() => setKycStatus({ status: 'NOT_STARTED' })) // Assume not started if endpoint fails
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) {
    return <ActivityIndicator />;
  }

  switch (kycStatus?.status) {
    case 'APPROVED':
      return <Text style={styles.cardText}>Your identity is verified. ✅</Text>;
    case 'SUBMITTED':
      return <Text style={styles.cardText}>Your submission is under review.</Text>;
    case 'REJECTED':
      return <Text style={styles.cardText}>Your verification was rejected. Please try again.</Text>;
    default:
      return (
        <>
          <Text style={styles.cardText}>
            Your identity is not verified. Complete verification to unlock all features.
          </Text>
          <Button
            title="Verify Identity"
            onPress={() => (navigation as any).navigate('KycIntroScreen')}
          />
        </>
      );
  }
}


export default function ProfileScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity Verification</Text>
        <KycStatusCard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    margin: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    marginBottom: 15,
  },
});
