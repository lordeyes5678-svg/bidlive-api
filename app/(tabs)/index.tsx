import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useListAuctions, useGetAuctionStats, ListAuctionsStatus, useGetWishlist, useAddToWishlist, useRemoveFromWishlist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { AuctionCard } from "@/components/AuctionCard";
import { useColors } from "@/hooks/useColors";

const FILTERS: { label: string; value: ListAuctionsStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Ended", value: "ended" },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListAuctionsStatus | "all">("all");
  const [category, setCategory] = useState<string | undefined>();

  const { data: stats } = useGetAuctionStats();
  
  const queryParams = {
    search: search || undefined,
    status: status === "all" ? undefined : status,
    category,
    limit: 20,
  };

  const { data, isLoading, refetch, isRefetching } = useListAuctions(queryParams);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.card }]}>
        <View style={styles.topBar}>
          <Text style={[styles.logo, { color: colors.primary }]}>BidLive</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
            placeholder="Search auctions..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.filtersWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={FILTERS}
            keyExtractor={item => item.value}
            contentContainerStyle={styles.filtersList}
            renderItem={({ item }) => {
              const isActive = status === item.value;
              return (
                <Pressable
                  style={[
                    styles.filterChip,
                    { backgroundColor: isActive ? colors.primary : colors.secondary }
                  ]}
                  onPress={() => setStatus(item.value)}
                >
                  <Text style={[
                    styles.filterText,
                    { color: isActive ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }}
          />
        </View>

        {stats?.categories && stats.categories.length > 0 && (
          <View style={[styles.filtersWrapper, { marginTop: 8 }]}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ name: "All Categories", count: 0 }, ...stats.categories]}
              keyExtractor={item => item.name}
              contentContainerStyle={styles.filtersList}
              renderItem={({ item }) => {
                const isAll = item.name === "All Categories";
                const isActive = isAll ? !category : category === item.name;
                
                return (
                  <Pressable
                    style={[
                      styles.filterChip,
                      { backgroundColor: isActive ? colors.cardForeground : colors.secondary }
                    ]}
                    onPress={() => setCategory(isAll ? undefined : item.name)}
                  >
                    <Text style={[
                      styles.filterText,
                      { color: isActive ? colors.background : colors.foreground }
                    ]}>
                      {item.name} {item.count > 0 && `(${item.count})`}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        )}
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
              <Feather name="inbox" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No auctions found</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  filtersWrapper: {
    marginHorizontal: -16,
  },
  filtersList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
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
