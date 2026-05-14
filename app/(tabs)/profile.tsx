import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
        <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="activity" size={24} color={colors.primary} style={styles.statIcon} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{user.totalBids}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total Bids</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="award" size={24} color={colors.primary} style={styles.statIcon} />
          <Text style={[styles.statValue, { color: colors.foreground }]}>{user.auctionsWon}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Auctions Won</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={[styles.settingsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingItemLeft}>
              <Feather name="user" size={20} color={colors.foreground} />
              <Text style={[styles.settingText, { color: colors.foreground }]}>Edit Profile</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingItemLeft}>
              <Feather name="credit-card" size={20} color={colors.foreground} />
              <Text style={[styles.settingText, { color: colors.foreground }]}>Payment Methods</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Pressable style={[styles.settingItem, { borderBottomColor: colors.border }]}>
            <View style={styles.settingItemLeft}>
              <Feather name="bell" size={20} color={colors.foreground} />
              <Text style={[styles.settingText, { color: colors.foreground }]}>Notifications</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable 
          style={[styles.logoutBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={logout}
        >
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Log Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "800",
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  settingsList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: "600",
  },
  logoutBtn: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
