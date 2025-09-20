import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export type ChatBubbleProps = {
  text: string;
  fromMe: boolean;
  onReact?: (reaction: string) => void;
};

const reactions = ['👍', '❤️', '😂', '😮', '😢'];

export default function ChatBubble({ text, fromMe, onReact }: ChatBubbleProps): React.JSX.Element {
  const theme = useTheme();
  const [showReactions, setShowReactions] = useState(false);
  return (
    <View style={{ alignSelf: fromMe ? 'flex-end' : 'flex-start' }}>
      <Pressable
        onLongPress={() => setShowReactions(v => !v)}
        style={[
          styles.bubble,
          {
            backgroundColor: fromMe ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming,
            borderTopLeftRadius: fromMe ? theme.radius.lg : theme.radius.sm,
            borderTopRightRadius: fromMe ? theme.radius.sm : theme.radius.lg,
          },
        ]}
      >
        <Text style={{ color: theme.colors.textPrimary, fontSize: theme.typography.sizes.md }}>{text}</Text>
      </Pressable>
      {showReactions && (
        <View style={[styles.reactions, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          {reactions.map(r => (
            <Pressable key={r} onPress={() => { setShowReactions(false); onReact?.(r); }} style={styles.reaction}>
              <Text style={{ fontSize: 18 }}>{r}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
    borderRadius: 16,
    maxWidth: '80%',
  },
  reactions: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  reaction: { padding: 4 },
});

