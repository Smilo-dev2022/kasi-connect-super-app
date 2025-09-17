import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@theme/ThemeProvider';

type ChatMessage = {
  id: string;
  text: string;
  fromMe: boolean;
};

export default function MessagesScreen(): React.JSX.Element {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: '1', text: 'Welcome to iKasiLink chat 👋', fromMe: false },
    { id: '2', text: 'This is a fast FlashList-based chat.', fromMe: true },
  ]);
  const listRef = useRef<FlashList<ChatMessage>>(null);

  const data = useMemo(() => [...messages].reverse(), [messages]);

  function send() {
    if (!input.trim()) return;
    const newMsg: ChatMessage = { id: String(Date.now()), text: input.trim(), fromMe: true };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    requestAnimationFrame(() => listRef.current?.scrollToOffset({ animated: true, offset: 0 }));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <FlashList
          ref={listRef}
          data={data}
          inverted
          renderItem={({ item }) => (
            <View style={[
              styles.bubble,
              {
                alignSelf: item.fromMe ? 'flex-end' : 'flex-start',
                backgroundColor: item.fromMe ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming,
                borderTopLeftRadius: item.fromMe ? theme.radius.lg : theme.radius.sm,
                borderTopRightRadius: item.fromMe ? theme.radius.sm : theme.radius.lg,
              }
            ]}>
              <Text style={{ color: theme.colors.textPrimary }}>{item.text}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={64}
          contentContainerStyle={styles.listContent}
        />

        <View style={[styles.inputBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <View style={styles.sendButton} onTouchEnd={send} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 12 },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    maxWidth: '80%',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: '#128C7E',
  },
});


