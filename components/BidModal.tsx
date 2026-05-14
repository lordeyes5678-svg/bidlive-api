import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface BidModalProps {
  visible: boolean;
  onClose: () => void;
  currentBid: number;
  onPlaceBid: (amount: number) => Promise<void>;
  isLoading: boolean;
}

export function BidModal({ visible, onClose, currentBid, onPlaceBid, isLoading }: BidModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");

  const minBid = currentBid + 1;

  const handleSubmit = () => {
    const val = Number(amount);
    if (!isNaN(val) && val >= minBid) {
      onPlaceBid(val);
    }
  };

  const handleQuickBid = (increment: number) => {
    onPlaceBid(currentBid + increment);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]}>Place a Bid</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Feather name="x" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            <View style={styles.content}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Current Bid</Text>
              <Text style={[styles.currentBidText, { color: colors.primary }]}>${currentBid.toLocaleString()}</Text>

              <View style={styles.quickBids}>
                {[10, 50, 100].map(inc => (
                  <Pressable 
                    key={inc}
                    style={[styles.quickBidBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => handleQuickBid(inc)}
                    disabled={isLoading}
                  >
                    <Text style={[styles.quickBidText, { color: colors.foreground }]}>+${inc}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.currencySymbol, { color: colors.foreground }]}>$</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderBottomColor: colors.border }]}
                  placeholder={minBid.toString()}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  editable={!isLoading}
                />
              </View>

              <Pressable 
                style={[
                  styles.submitBtn, 
                  { backgroundColor: colors.primary },
                  (isLoading || (amount && Number(amount) < minBid)) && { opacity: 0.5 }
                ]}
                onPress={handleSubmit}
                disabled={isLoading || (amount && Number(amount) < minBid)}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.submitText, { color: colors.primaryForeground }]}>Confirm Bid</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  keyboardView: {
    width: "100%",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  content: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  currentBidText: {
    fontSize: 32,
    fontWeight: "900",
    marginTop: -8,
  },
  quickBids: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  quickBidBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quickBidText: {
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "700",
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 56,
    borderBottomWidth: 2,
    fontSize: 32,
    fontWeight: "700",
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  submitText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
