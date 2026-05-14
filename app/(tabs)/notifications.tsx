import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, NotificationType } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "outbid": return "alert-triangle";
    case "auction_won": return "award";
    case "auction_ending": return "clock";
    case "payment_success": return "check-circle";
    default: return "bell";
  }
};

const getNotificationColor = (type: NotificationType, colors: ReturnType<typeof useColors>) => {
  switch (type) {
    case "outbid": return colors.destructive;
    case "auction_won": return colors.success;
    case "auction_ending": return colors.primary;
    case "payment_success": return colors.success;
    default: return colors.foreground;
  }
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch, isRefetching } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handlePress = async (notification: any) => {
    if (!notification.read) {
      await markRead.mutateAsync({ id: notification.id });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
    if (notification.auctionId) {
      router.push(`/auction/${notification.auctionId}`);
    }
  };

  const handleMarkAll = async () => {
    await markAllRead.mutateAsync();
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
  };

  const hasUnread = data?.some(n => !n.read);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Alerts</Text>
        {hasUnread && (
          <Pressable onPress={handleMarkAll} hitSlop={12}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="bell-off" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No notifications yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const iconName = getNotificationIcon(item.type);
            const iconColor = getNotificationColor(item.type, colors);
            
            return (
              <Pressable 
                style={[
                  styles.item, 
                  { backgroundColor: item.read ? colors.card : colors.secondary, borderBottomColor: colors.border }
                ]}
                onPress={() => handlePress(item)}
              >
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                  <Feather name={iconName as any} size={24} color={iconColor} />
                </View>
                <View style={styles.content}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.itemMessage, { color: colors.mutedForeground }]}>{item.message}</Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  markAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    flexGrow: 1,
  },
  item: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  itemMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
});
