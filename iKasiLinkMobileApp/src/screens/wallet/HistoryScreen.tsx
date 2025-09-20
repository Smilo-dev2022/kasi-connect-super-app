import React from 'react';
import { View, Text, Button } from 'react-native';

const HistoryScreen = () => {
  return (
    <View>
      <Text>Transaction History</Text>
      {/* TODO: Implement transaction history list */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
        <Button title="Filter Buy" onPress={() => { /* TODO: Implement filtering */ }} />
        <Button title="Filter Sell" onPress={() => { /* TODO: Implement filtering */ }} />
        <Button title="Filter All" onPress={() => { /* TODO: Implement filtering */ }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
        <Button title="Export PDF" onPress={() => { /* TODO: Implement PDF export */ }} />
        <Button title="Export CSV" onPress={() => { /* TODO: Implement CSV export */ }} />
      </View>
    </View>
  );
};

export default HistoryScreen;
