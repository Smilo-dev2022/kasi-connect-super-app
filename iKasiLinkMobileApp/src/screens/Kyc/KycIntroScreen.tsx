import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const KycIntroScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Identity</Text>
      <Text style={styles.text}>
        To comply with regulations and keep your account secure, we need to verify your identity.
      </Text>
      <Text style={styles.text}>
        You will need a valid ID document and to take a selfie.
      </Text>
      <Button
        title="Start Verification"
        onPress={() => (navigation as any).navigate('KycIdScreen')}
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
    marginBottom: 10,
  },
});

export default KycIntroScreen;
