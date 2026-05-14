import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useGetAuction, useGetAuctionBids, usePlaceBid } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { CountdownTimer } from "@/components/CountdownTimer";
import { BidModal } from "@/components/BidModal";

export default function AuctionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { joinAuction, leaveAuction, placeBid: socketPlaceBid, onBidUpdated, onAuctionEnded } = useSocket();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  
  const { data: auction, isLoading } = useGetAuction(id, { query: { enabled: !!id } });
  const { data: bids, isLoading: isLoadingBids, refetch: refetchBids } = useGetAuctionBids(id, { limit: 10 }, { query: { enabled: !!id } });
  const placeBidMutation = usePlaceBid();

  const lastBidRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) return;
    joinAuction(id);

    const unsubscribeBid = onBidUpdated((payload) => {
      if (payload.auctionId === id) {
        queryClient.setQueryData([`/api/auctions/${id}`], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            currentBid: payload.currentBid,
            highestBidderId: payload.highestBidderId,
            highestBidderName: payload.highestBidderName,
            bidCount: old.bidCount + 1,
          };
        });
        refetchBids();
        
        // Haptic feedback logic
        if (user && payload.highestBidderId !== user.id && auction && auction.highestBidderId === user.id) {
          // You just got outbid
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (user && payload.highestBidderId === user.id) {
          // You just placed the winning bid
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });

    const unsubscribeEnd = onAuctionEnded((payload) => {
      if (payload.auctionId === id) {
        queryClient.invalidateQueries({ queryKey: [`/api/auctions/${id}`] });
        if (user && payload.winnerId === user.id) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    });

    return () => {
      leaveAuction(id);
      unsubscribeBid();
      unsubscribeEnd();
    };
  }, [id, joinAuction, leaveAuction, onBidUpdated, onAuctionEnded, queryClient, refetchBids, user, auction]);

  const handlePlaceBid = async (amount: number) => {
    if (!id || !auction) return;
    try {
      setIsPlacingBid(true);
      
      // Use socket directly as per spec if API takes longer, or use API mutation
      await placeBidMutation.mutateAsync({ id, data: { amount } });
      socketPlaceBid(id, amount);
      
      setModalVisible(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e: any) {
      Alert.alert("Bid Failed", e?.message || "Could not place bid");
    } finally {
      setIsPlacingBid(false);
    }
  };

  if (isLoading || !auction) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isWinning = user && auction.highestBidderId === user.id;
  const hasBid = user && bids && bids.some(b => b.userId === user.id);
  const isOutbid = hasBid && !isWinning;
  const isLive = auction.status === "active";
  const isEnded = auction.status === "ended";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        headerTransparent: true, 
        headerTitle: "",
        headerTintColor: "#FFF",
        headerLeft: () => (
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </Pressable>
        )
      }} />

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.imageContainer}>
          <Image 
            source={auction.images[0] || require("@/assets/images/placeholder_item.png")}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.imageOverlay} />
        </View>

        <View style={styles.content}>
          {(isWinning || isOutbid) && isLive && (
            <View style={[
              styles.statusBanner, 
              { backgroundColor: isWinning ? colors.success : colors.destructive }
            ]}>
              <Feather name={isWinning ? "check-circle" : "alert-triangle"} size={20} color="#FFF" />
              <Text style={styles.statusBannerText}>
                {isWinning ? "You're currently winning!" : "You've been outbid!"}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{auction.condition.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{auction.category}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{auction.title}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>{auction.description}</Text>

          <View style={[styles.bidSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.bidSectionInner}>
              <View>
                <Text style={[styles.bidLabel, { color: colors.mutedForeground }]}>Current Bid</Text>
                <Text style={[styles.currentBid, { color: colors.primary }]}>${auction.currentBid.toLocaleString()}</Text>
                <Text style={[styles.bidCount, { color: colors.mutedForeground }]}>{auction.bidCount} bids</Text>
              </View>
              <View style={styles.timerWrapper}>
                <Text style={[styles.bidLabel, { color: colors.mutedForeground, textAlign: "right" }]}>
                  {isEnded ? "Ended" : "Time Left"}
                </Text>
                <CountdownTimer endTime={auction.endTime} size="large" />
              </View>
            </View>
          </View>

          <View style={styles.historySection}>
            <Text style={[styles.historyTitle, { color: colors.foreground }]}>Bid History</Text>
            
            {isLoadingBids ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
            ) : bids && bids.length > 0 ? (
              bids.map((bid) => (
                <View key={bid.id} style={[styles.bidRow, { borderBottomColor: colors.border }]}>
                  <View style={styles.bidderInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.avatarText, { color: colors.foreground }]}>{bid.userName.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.bidderName, { color: colors.foreground }]}>
                      {bid.userId === user?.id ? "You" : bid.userName}
                    </Text>
                  </View>
                  <View style={styles.bidAmountWrap}>
                    <Text style={[styles.historyAmount, { color: colors.foreground }]}>${bid.amount.toLocaleString()}</Text>
                    <Text style={[styles.historyTime, { color: colors.mutedForeground }]}>
                      {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.emptyHistory, { color: colors.mutedForeground }]}>No bids yet. Be the first!</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {isLive && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable 
            style={[styles.placeBidBtn, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={[styles.placeBidText, { color: colors.primaryForeground }]}>Place Bid</Text>
          </Pressable>
        </View>
      )}

      <BidModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentBid={auction.currentBid}
        onPlaceBid={handlePlaceBid}
        isLoading={isPlacingBid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    marginTop: 8,
  },
  imageContainer: {
    width: "100%",
    height: 400,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 13, 13, 0.3)",
  },
  content: {
    padding: 24,
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#0D0D0D",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  statusBannerText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  bidSection: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 32,
  },
  bidSectionInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  currentBid: {
    fontSize: 40,
    fontWeight: "900",
  },
  bidCount: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  timerWrapper: {
    alignItems: "flex-end",
  },
  historySection: {
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 16,
  },
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bidderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
  bidderName: {
    fontSize: 16,
    fontWeight: "600",
  },
  bidAmountWrap: {
    alignItems: "flex-end",
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: "800",
  },
  historyTime: {
    fontSize: 12,
    marginTop: 4,
  },
  emptyHistory: {
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 32,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  placeBidBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  placeBidText: {
    fontSize: 18,
    fontWeight: "800",
  },
});
