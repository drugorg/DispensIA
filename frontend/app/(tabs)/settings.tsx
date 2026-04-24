import { useUser, useClerk } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export default function SettingsScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const handleSignOut = () => {
    Alert.alert('Logout', 'Sei sicuro di voler uscire?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Dispens<Text style={{ color: colors.accent }}>IA</Text>
        </Text>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Profilo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 14, paddingBottom: 40 }}>
        <View style={[styles.card, { padding: 18 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 20 }}>
                  {user?.firstName?.[0]?.toUpperCase() || user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.fullName || user?.firstName || 'Utente'}</Text>
              <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          {[
            { icon: 'information-circle-outline', label: 'Informazioni' },
            { icon: 'shield-checkmark-outline', label: 'Privacy & Dati' },
            { icon: 'document-text-outline', label: 'Termini di servizio' },
          ].map((item, i) => (
            <Pressable key={i} style={[styles.row, i < 2 && styles.rowBorder]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ionicons name={item.icon as any} size={20} color={colors.text2} />
                <Text style={styles.rowLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </Pressable>
          ))}
        </View>

        <Pressable style={[styles.card, { padding: 16, alignItems: 'center' }]} onPress={handleSignOut}>
          <Text style={{ color: colors.red, fontWeight: '700', fontSize: 15 }}>Esci</Text>
        </Pressable>

        <Text style={styles.version}>DispensIA v2.0 · fatto con ❤️ e AI</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  logo: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  titleWrap: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  card: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.border, borderRadius: 18, overflow: 'hidden' },
  avatar: { width: 52, height: 52, borderRadius: 14 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  email: { color: colors.text2, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { color: colors.text, fontSize: 14, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, color: colors.text3, marginTop: 10 },
});
