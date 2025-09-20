import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import QuoteScreen from '@screens/wallet/QuoteScreen';
import ConfirmScreen from '@screens/wallet/ConfirmScreen';
import ReceiptScreen from '@screens/wallet/ReceiptScreen';
import HistoryScreen from '@screens/wallet/HistoryScreen';

export type WalletStackParamList = {
  Quote: undefined;
  Confirm: undefined;
  Receipt: undefined;
  History: undefined;
};

const WalletStack = createNativeStackNavigator<WalletStackParamList>();

function WalletNavigator(): React.JSX.Element {
  return (
    <WalletStack.Navigator>
      <WalletStack.Screen name="History" component={HistoryScreen} />
      <WalletStack.Screen name="Quote" component={QuoteScreen} />
      <WalletStack.Screen name="Confirm" component={ConfirmScreen} />
      <WalletStack.Screen name="Receipt" component={ReceiptScreen} />
    </WalletStack.Navigator>
  );
}

export default WalletNavigator;
