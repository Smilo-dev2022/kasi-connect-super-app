import React from 'react';
import { View, Text, Button } from 'react-native';

const ConfirmScreen = () => {
  return (
    <View>
      <Text>Confirm Screen</Text>
      {/* TODO: Implement confirmation logic and countdown timer */}
      <Button title="Place Order" onPress={() => { /* TODO: Navigate to Receipt screen */ }} />
    </View>
  );
};

export default ConfirmScreen;
