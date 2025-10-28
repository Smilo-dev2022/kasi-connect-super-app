import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@theme/ThemeProvider';
import ChatBubble from '@components/ChatBubble';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Haptic from 'react-native-haptic-feedback';
import { getSocket } from '@realtime/socket';
import { api } from '@api/client';
import { launchImageLibrary } from 'react-native-image-picker';

type ChatMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  imageUri?: string;
};

export default function MessagesScreen(): React.JSX.Element {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('chat:messages');
      if (raw) {
        setMessages(JSON.parse(raw));
      } else {
        setMessages([
          { id: '1', text: 'Welcome to iKasiLink chat 👋', fromMe: false },
          { id: '2', text: 'This is a fast FlashList-based chat.', fromMe: true },
        ]);
      }
      // attempt fetch of missed messages from server (since last persisted ts)
      try {
        const since = Number(await AsyncStorage.getItem('chat:last_ts') || '0');
        const res = await api.get(`/messages/since/${since}`);
        const serverMessages: any[] = res?.data?.messages ?? [];
        const mapped: ChatMessage[] = serverMessages.map(m => ({ id: String(m.id), text: String(m.ciphertext || ''), fromMe: false }));
        if (mapped.length) setMessages(prev => [...prev, ...mapped]);
        await AsyncStorage.setItem('chat:last_ts', String(Date.now()));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('chat:messages', JSON.stringify(messages));
  }, [messages]);
  const listRef = useRef<any>(null);

  const data = useMemo(() => messages, [messages]);

  // Connect WS and receive messages
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const ws = await getSocket();
        ws.addEventListener('message', (evt: any) => {
          try {
            const payload = JSON.parse(String(evt?.data || ''));
            if (payload?.type === 'msg') {
              const isMine = Boolean(payload?.fromMe) || false;
              setMessages(prev => [...prev, { id: String(payload.id), text: String(payload.ciphertext || ''), fromMe: isMine }]);
            }
          } catch {}
        });
      } catch {}
    })();
    return () => { try { unsub?.(); } catch {} };
  }, []);

  async function send() {
    if (!input.trim()) return;
    const id = String(Date.now());
    const plaintext = input.trim();
    const envelope = { type: 'msg', id, to: 'bob', scope: 'direct', ciphertext: plaintext, contentType: 'text/plain', timestamp: Date.now() };
    try {
      const ws = await getSocket();
      ws.send(JSON.stringify(envelope));
      const newMsg: ChatMessage = { id, text: plaintext, fromMe: true };
      setMessages(prev => [...prev, newMsg]);
    } catch {}
    setInput('');
    Haptic.trigger('impactLight');
    // Content is bottom-aligned via contentContainerStyle; no explicit scroll needed
  }

  async function attach() {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    const asset = result.assets?.[0];
    if (asset?.uri) {
      const newMsg: ChatMessage = { id: String(Date.now()), text: '', fromMe: true, imageUri: asset.uri };
      setMessages(prev => [...prev, newMsg]);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <FlashList
          ref={listRef}
          data={data}
          renderItem={({ item }) => (
            <ChatBubble text={item.text || (item.imageUri ? '📷 Photo' : '')} fromMe={item.fromMe} />
          )}
          keyExtractor={(item) => item.id}
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
          <View style={styles.attachButton} onTouchEnd={attach} />
          <View style={styles.sendButton} onTouchEnd={send} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 12, flexGrow: 1, justifyContent: 'flex-end' },
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
  attachButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: '#0ea5e9',
  },
});


