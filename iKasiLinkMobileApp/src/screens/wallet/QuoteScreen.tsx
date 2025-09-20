import React from 'react';
import { View, Text, Button } from 'react-native';

const QuoteScreen = () => {
  return (
    <View>
      <Text>Quote Screen</Text>
      {/* TODO: Implement quote fetching and display */}
      <Button title="Confirm" onPress={() => { /* TODO: Navigate to Confirm screen */ }} />
    </View>
  );
};

export default QuoteScreen;
