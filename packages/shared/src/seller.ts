export type SellerStatus = "pending_review" | "approved" | "rejected" | "paused";

export type SellerApplication = {
  id: string;
  userId: string;
  storeName: string;
  legalName: string;
  countryCode: string;
  categoryFocus: string;
  status: SellerStatus;
  payoutHoldDays: number;
  createdAt: string;
};

export type SellerDashboardSummary = {
  sellerId: string;
  storeName: string;
  status: SellerStatus;
  upcomingShows: number;
  liveShows: number;
  totalOrders: number;
  grossMerchandiseValue: number;
  payoutHoldDays: number;
};
