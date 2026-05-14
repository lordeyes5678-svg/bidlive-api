import { useQuery, useMutation, UseQueryOptions } from "@tanstack/react-query";

// ============================================================
// Configuration
// ============================================================

let _baseUrl = "";
let _authTokenGetter: (() => string | null) | null = null;

export function setBaseUrl(url: string) {
  _baseUrl = url;
}

export function setAuthTokenGetter(getter: () => string | null) {
  _authTokenGetter = getter;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = _authTokenGetter?.();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${_baseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ============================================================
// Types
// ============================================================

export interface User {
  id: string;
  name: string;
  email: string;
  totalBids: number;
  auctionsWon: number;
  createdAt: string;
}

export interface Auction {
  id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  condition: string;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  status: "active" | "upcoming" | "ended";
  startTime: string;
  endTime: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  createdAt: string;
}

export interface AuctionStats {
  totalAuctions: number;
  activeAuctions: number;
  categories: { name: string; count: number }[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  auctionId?: string;
  read: boolean;
  createdAt: string;
}

export type ListAuctionsStatus = "active" | "upcoming" | "ended";

export type NotificationType =
  | "outbid"
  | "auction_won"
  | "auction_ending"
  | "payment_success"
  | "general";

// ============================================================
// Auth Hooks
// ============================================================

export function useGetMe(options?: { query?: Partial<UseQueryOptions<User>> }) {
  return useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: () => apiFetch<User>("/api/auth/me"),
    ...options?.query,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      apiFetch<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { name: string; email: string; password: string }) =>
      apiFetch<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ============================================================
// Auction Hooks
// ============================================================

interface ListAuctionsParams {
  search?: string;
  status?: ListAuctionsStatus;
  category?: string;
  limit?: number;
}

export function useListAuctions(params?: ListAuctionsParams, options?: { query?: Partial<UseQueryOptions> }) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  const path = `/api/auctions${qs ? `?${qs}` : ""}`;

  return useQuery<{ auctions: Auction[] }>({
    queryKey: ["/api/auctions", params],
    queryFn: () => apiFetch<{ auctions: Auction[] }>(path),
    ...options?.query,
  });
}

export function useGetAuction(id: string, options?: { query?: Partial<UseQueryOptions<Auction>> }) {
  return useQuery<Auction>({
    queryKey: [`/api/auctions/${id}`],
    queryFn: () => apiFetch<Auction>(`/api/auctions/${id}`),
    ...options?.query,
  });
}

interface GetAuctionBidsParams {
  limit?: number;
}

export function useGetAuctionBids(
  id: string,
  params?: GetAuctionBidsParams,
  options?: { query?: Partial<UseQueryOptions<Bid[]>> }
) {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const qs = searchParams.toString();
  const path = `/api/auctions/${id}/bids${qs ? `?${qs}` : ""}`;

  return useQuery<Bid[]>({
    queryKey: [`/api/auctions/${id}/bids`, params],
    queryFn: () => apiFetch<Bid[]>(path),
    ...options?.query,
  });
}

export function usePlaceBid() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number } }) =>
      apiFetch<Bid>(`/api/auctions/${id}/bids`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useGetAuctionStats() {
  return useQuery<AuctionStats>({
    queryKey: ["/api/auctions/stats"],
    queryFn: () => apiFetch<AuctionStats>("/api/auctions/stats"),
  });
}

// ============================================================
// Wishlist Hooks
// ============================================================

export function useGetWishlist() {
  return useQuery<Auction[]>({
    queryKey: ["/api/auctions/wishlist"],
    queryFn: () => apiFetch<Auction[]>("/api/auctions/wishlist"),
  });
}

export function useAddToWishlist() {
  return useMutation({
    mutationFn: ({ data }: { data: { auctionId: string } }) =>
      apiFetch<{ success: boolean }>("/api/auctions/wishlist", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useRemoveFromWishlist() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ success: boolean }>(`/api/auctions/wishlist/${id}`, {
        method: "DELETE",
      }),
  });
}

// ============================================================
// Notification Hooks
// ============================================================

export function useGetNotifications() {
  return useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiFetch<Notification[]>("/api/notifications"),
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: ({ id }: { id: string }) =>
      apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, {
        method: "POST",
      }),
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success: boolean }>("/api/notifications/read-all", {
        method: "POST",
      }),
  });
}
