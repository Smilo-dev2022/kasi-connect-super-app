import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const KycResultScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Submission Received</Text>
      <Text style={styles.text}>
        We have received your submission and are reviewing it.
      </Text>
      <Text style={styles.text}>
        You will be notified once the review is complete.
      </Text>
      <Button
        title="Back to Profile"
        onPress={() => (navigation as any).navigate('Profile')}
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

export default KycResultScreen;
