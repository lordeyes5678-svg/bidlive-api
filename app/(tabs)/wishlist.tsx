import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { AuctionCard } from "@/components/AuctionCard";
import { useColors } from "@/hooks/useColors";

export default function WishlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const { data, isLoading, refetch, isRefetching } = useGetWishlist();
  const removeWishlist = useRemoveFromWishlist();

  const handleRemoveWishlist = async (auctionId: string) => {
    await removeWishlist.mutateAsync({ id: auctionId });
    queryClient.invalidateQueries({ queryKey: ["/api/auctions/wishlist"] });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Wishlist</Text>
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
              <Feather name="heart" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Your wishlist is empty</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap the heart icon on any auction to save it for later.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AuctionCard 
              auction={item as any} // Cast is needed because the schema returned by useGetWishlist might slightly differ from Auction depending on the API but typically represents the same data
              isWishlisted={true}
              onToggleWishlist={handleRemoveWishlist}
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
  title: {
    fontSize: 32,
    fontWeight: "800",
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
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 240,
  },
});
