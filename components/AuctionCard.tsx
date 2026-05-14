import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Auction } from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { CountdownTimer } from "./CountdownTimer";

interface AuctionCardProps {
  auction: Auction;
  isWishlisted?: boolean;
  onToggleWishlist?: (auctionId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function AuctionCard({ auction, isWishlisted, onToggleWishlist, style }: AuctionCardProps) {
  const colors = useColors();

  const handleWishlistPress = () => {
    if (onToggleWishlist) {
      onToggleWishlist(auction.id);
    }
  };

  const isLive = auction.status === "active";
  
  return (
    <Pressable 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      onPress={() => router.push(`/auction/${auction.id}`)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={auction.images[0] || require("@/assets/images/placeholder_item.png")}
          style={styles.image}
          contentFit="cover"
        />
        {isLive && (
          <View style={[styles.liveBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveText, { color: colors.foreground }]}>LIVE</Text>
          </View>
        )}
        <Pressable 
          style={styles.wishlistBtn}
          onPress={handleWishlistPress}
          hitSlop={8}
        >
          <Feather 
            name="heart" 
            size={20} 
            color={isWishlisted ? colors.destructive : "#FFFFFF"} 
            style={isWishlisted && styles.wishlistIconActive}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {auction.title}
          </Text>
        </View>

        <View style={styles.meta}>
          <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{auction.condition.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.pillText, { color: colors.mutedForeground }]}>{auction.category}</Text>
          </View>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Current Bid</Text>
            <Text style={[styles.bidAmount, { color: colors.primary }]}>${auction.currentBid.toLocaleString()}</Text>
          </View>
          <View style={styles.timerContainer}>
            <Text style={[styles.label, { color: colors.mutedForeground, textAlign: "right" }]}>Ends in</Text>
            <CountdownTimer endTime={auction.endTime} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageContainer: {
    height: 180,
    width: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  liveBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "800",
  },
  wishlistBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  wishlistIconActive: {
    fill: "#EF4444", // Assuming destructive is red
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTopWidth: 1,
    paddingTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  bidAmount: {
    fontSize: 20,
    fontWeight: "800",
  },
  timerContainer: {
    alignItems: "flex-end",
  },
});
