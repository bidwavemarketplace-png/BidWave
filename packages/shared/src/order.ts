export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "fulfillment_pending"
  | "shipped"
  | "delivered"
  | "refunded"
  | "cancelled";

export type OrderSummary = {
  id: string;
  buyerName: string;
  sellerName: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  placedAt: string;
  showId?: string;
  showTitle?: string;
  buyerId?: string;
  sellerId?: string;
  orderType?: "won" | "sold";
  itemTitles?: string[];
  shippingAmount?: number;
  trackingNumber?: string;
  deliveryProvider?: string;
  trackingStatus?: string;
  trackingLastEvent?: string;
  trackingLastEventAt?: string;
};

export type OrderDetail = OrderSummary & {
  showTitle: string;
  lineItems: Array<{
    title: string;
    pricingMode: "auction" | "buy_now";
    amount: number;
  }>;
  paymentStatus: string;
  shipmentStatus: string;
};
