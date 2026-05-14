import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListAuctions, useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { AuctionCard } from "@/components/AuctionCard";
import { useColors } from "@/hooks/useColors";

export default function LiveScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch, isRefetching } = useListAuctions({ status: "active", limit: 50 });
  const { data: wishlistItems } = useGetWishlist();
  
  const addWishlist = useAddToWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const handleToggleWishlist = async (auctionId: string) => {
    const isWishlisted = wishlistItems?.some(item => item.id === auctionId);
    if (isWishlisted) {
      await removeWishlist.mutateAsync({ id: auctionId });
    } else {
      await addWishlist.mutateAsync({ data: { auctionId } });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/auctions/wishlist"] });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Live Now</Text>
          <View style={[styles.liveIndicator, { backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Auctions ending soon</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={data?.auctions || []}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="moon" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No live auctions right now</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AuctionCard 
              auction={item} 
              isWishlisted={wishlistItems?.some(w => w.id === item.id)}
              onToggleWishlist={handleToggleWishlist}
            />
          )}
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
    padding: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  liveIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  list: {
    padding: 16,
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
