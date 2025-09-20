import React from 'react';
import { View, Text, Button } from 'react-native';

const ReceiptScreen = () => {
  return (
    <View>
      <Text>Receipt Screen</Text>
      {/* TODO: Implement receipt display with txHash and partnerRef */}
      <Button title="Done" onPress={() => { /* TODO: Navigate back to home or wallet */ }} />
    </View>
  );
};

export default ReceiptScreen;
