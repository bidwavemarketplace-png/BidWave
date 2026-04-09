export const sellerSummary = {
  sellerId: "usr_seller_1",
  storeName: "CardCellar CZ",
  status: "approved",
  upcomingShows: 1,
  liveShows: 1,
  totalOrders: 2,
  grossMerchandiseValue: 231.5,
  payoutHoldDays: 7
};

export const sellerShows = [
  {
    id: "show_live_1",
    title: "Tonight's Pokemon Break",
    status: "live",
    scheduledFor: "2026-04-01 20:00",
    sellerName: "CardCellar CZ"
  },
  {
    id: "show_sched_1",
    title: "Sunday Slabs",
    status: "scheduled",
    scheduledFor: "2026-04-05 19:00",
    sellerName: "CardCellar CZ"
  }
];

export const sellerOrders = [
  {
    id: "ord_1",
    buyerName: "Marek V.",
    status: "paid",
    totalAmount: "82.50 EUR",
    placedAt: "2026-03-28 20:22"
  },
  {
    id: "ord_2",
    buyerName: "Zuzana K.",
    status: "fulfillment_pending",
    totalAmount: "149.00 EUR",
    placedAt: "2026-03-30 21:01"
  }
];
