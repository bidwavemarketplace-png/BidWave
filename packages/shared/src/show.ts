export type ShowStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";

export type ShowSummary = {
  id: string;
  title: string;
  sellerId: string;
  sellerName: string;
  status: ShowStatus;
  scheduledFor: string;
  lineupHidden?: boolean;
};

export type ShowItemSummary = {
  id: string;
  title: string;
  category: string;
  pricingMode: "auction" | "buy_now";
  startPrice?: number;
  buyNowPrice?: number;
  currency: string;
  imageUrl?: string;
  queuePosition?: number;
  lotStatus?: "queued" | "live" | "sold";
};

export type ShowDetail = ShowSummary & {
  description: string;
  viewers: number;
  coverImage: string;
  activeItemId?: string;
  items: ShowItemSummary[];
  streamRoomId: string;
  grossRevenue?: number;
  netRevenue?: number;
  recentWinner?: {
    itemId: string;
    itemTitle: string;
    winnerName: string;
    amount: number;
    settledAt: string;
  };
};
