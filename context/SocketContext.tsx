import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth, tokenRef } from "./AuthContext";

interface BidUpdatedPayload {
  auctionId: string;
  bid: number;
  currentBid: number;
  highestBidderId: string;
  highestBidderName: string;
}

interface AuctionEndedPayload {
  auctionId: string;
  winnerId: string;
  winnerName: string;
  finalBid: number;
}

interface SocketContextType {
  connected: boolean;
  joinAuction: (id: string) => void;
  leaveAuction: (id: string) => void;
  placeBid: (auctionId: string, amount: number) => void;
  onBidUpdated: (cb: (payload: BidUpdatedPayload) => void) => () => void;
  onAuctionEnded: (cb: (payload: AuctionEndedPayload) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const url = `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
    const socket = io(url, {
      auth: { token: tokenRef.current },
      transports: ["websocket"],
      path: "/api/socket.io",
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const joinAuction = (id: string) => {
    socketRef.current?.emit("join_auction", id);
  };

  const leaveAuction = (id: string) => {
    socketRef.current?.emit("leave_auction", id);
  };

  const placeBid = (auctionId: string, amount: number) => {
    socketRef.current?.emit("place_bid", { auctionId, amount });
  };

  const onBidUpdated = (cb: (payload: BidUpdatedPayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("bid_updated", cb);
    return () => socket.off("bid_updated", cb);
  };

  const onAuctionEnded = (cb: (payload: AuctionEndedPayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on("auction_ended", cb);
    return () => socket.off("auction_ended", cb);
  };

  return (
    <SocketContext.Provider
      value={{
        connected,
        joinAuction,
        leaveAuction,
        placeBid,
        onBidUpdated,
        onAuctionEnded,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
