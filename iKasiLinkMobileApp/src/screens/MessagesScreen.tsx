import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@theme/ThemeProvider';
import ChatBubble from '@components/ChatBubble';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Haptic from 'react-native-haptic-feedback';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

type ChatMessage = {
  id: string;
  text: string;
  fromMe: boolean;
  imageUri?: string;
};

export default function MessagesScreen(): React.JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation();
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
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('chat:messages', JSON.stringify(messages));
  }, [messages]);
  const listRef = useRef<any>(null);

  const data = useMemo(() => messages, [messages]);

  function send() {
    if (!input.trim()) return;
    const newMsg: ChatMessage = { id: String(Date.now()), text: input.trim(), fromMe: true };
    setMessages(prev => [...prev, newMsg]);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Chat</Text>
        <View style={{ width: 24 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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
            style={[styles.input, { color: theme.colors.textPrimary, backgroundColor: theme.colors.background }]}
            placeholder="Message"
            placeholderTextColor={theme.colors.textSecondary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={attach} style={styles.attachButton}>
            <Icon name="attach" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={send} style={styles.sendButton}>
            <Icon name="send" size={24} color={'white'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
    borderRadius: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachButton: {
    width: 36,
    height: 36,
    marginLeft: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


