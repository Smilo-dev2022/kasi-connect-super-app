import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, StyleSheet, View } from 'react-native';
import { api } from '@api/client';

export default function HomeScreen(): React.JSX.Element {
  const [rooms, setRooms] = useState<Array<{ groupId: string; name: string; ward: string; verified: boolean }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/safety/rooms');
        setRooms(res?.data?.rooms ?? []);
      } catch {
        setRooms([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Safety Rooms</Text>
      <FlatList
        data={rooms}
        refreshing={loading}
        onRefresh={async () => {
          try {
            const res = await api.get('/safety/rooms');
            setRooms(res?.data?.rooms ?? []);
          } catch {}
        }}
        keyExtractor={(item) => item.groupId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.ward} {item.verified ? '✅' : '•'}</Text>
            <TouchableOpacity style={styles.joinBtn} onPress={async () => {
              try { await api.post(`/safety/rooms/${item.groupId}/join`); } catch {}
            }}>
              <Text style={styles.joinTxt}>Join</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>{loading ? 'Loading…' : 'No safety rooms yet.'}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  item: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#ccc' },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 12, color: '#6b7280' },
  joinBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#128C7E' },
  joinTxt: { color: 'white', fontWeight: '600' },
});

