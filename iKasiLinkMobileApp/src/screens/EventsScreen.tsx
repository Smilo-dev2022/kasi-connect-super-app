import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, FlatList, View, TouchableOpacity, StyleSheet } from 'react-native';
import { api } from '@api/client';

export default function EventsScreen(): React.JSX.Element {
  const [events, setEvents] = useState<Array<{ id: string; title: string; when?: string }>>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/api/events');
      setEvents(res?.data ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <FlatList
        data={events}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.title || item.id}</Text>
            <TouchableOpacity style={styles.rsvpBtn} onPress={async () => {
              try { await api.post('/api/rsvps', { eventId: item.id, name: 'Mobile User' }); await load(); } catch {}
            }}>
              <Text style={styles.rsvpTxt}>RSVP</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.meta}>{loading ? 'Loading…' : 'No events yet.'}</Text>}
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
  rsvpBtn: { marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0ea5e9' },
  rsvpTxt: { color: 'white', fontWeight: '600' },
});

