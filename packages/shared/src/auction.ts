export type AuctionStatus = "scheduled" | "live" | "ended" | "settled" | "cancelled";

export type AuctionBid = {
  id: string;
  auctionId: string;
  userId: string;
  amount: number;
  placedAt: string;
};

export type AuctionState = {
  id: string;
  showItemId: string;
  showId: string;
  status: AuctionStatus;
  startPrice: number;
  currentPrice: number;
  minimumIncrement: number;
  endsAt: string;
  highestBidderId?: string;
  highestBidderName?: string;
  bidCount: number;
};
