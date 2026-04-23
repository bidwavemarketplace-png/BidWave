import type {
  AuctionState,
  OrderDetail,
  OrderSummary,
  SellerApplication,
  SellerDashboardSummary,
  ShowDetail,
  ShowItemSummary,
  ShowSummary
} from "@bidwave/shared";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import pg from "pg";

const now = "2026-04-01T12:00:00.000Z";
const LOT_DURATION_MS = 3 * 60 * 1000;
const EXTENSION_WINDOW_MS = 15 * 1000;
const EXTENSION_INCREMENT_MS = 15 * 1000;
const VIEWER_HEARTBEAT_TTL_MS = 15 * 1000;

type BuyerBidReadiness = {
  ready: boolean;
  status: "not_ready" | "ready" | "payment_retry_required" | "restricted";
  fullName?: string;
  dateOfBirth?: string;
  line1?: string;
  city?: string;
  postalCode?: string;
  countryCode?: string;
  phone?: string;
  defaultShippingAddressId?: string;
  defaultShippingMethodId?: string;
  defaultPaymentMethodId?: string;
  termsAcceptedAt?: string;
  shippingAddressSummary?: string;
  shippingMethodLabel?: string;
  cardSummary?: string;
  shippingProvider?: "packeta" | "balikovna";
  pickupPointId?: string;
  pickupPointLabel?: string;
  shippingPrice?: number;
};

type ShipmentGroupSummary = {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName: string;
  showId: string;
  showTitle: string;
  shippingStatus: "open" | "shipping_pending" | "shipping_paid";
  lotCount: number;
  buyerName: string;
  itemTitles: string[];
  itemAmounts: number[];
  totalAmount: number;
  shippingAmount: number;
  shippingMethodLabel?: string;
  pickupPointId?: string;
  pickupPointLabel?: string;
  currency: string;
  paymentStatus: "pending_capture" | "captured" | "released_to_seller" | "refunded";
  shipmentStatus: "grouped_open" | "needs_shipping" | "tracking_added" | "delivered_confirmed";
  sellerPayoutStatus: "pending_payment" | "held" | "released";
  trackingNumber?: string;
  deliveryProvider?: string;
  trackingStatus?: string;
  trackingLastEvent?: string;
  trackingLastEventAt?: string;
  placedAt: string;
};

type AuctionSettlementResult = {
  shipmentGroupId: string;
  shippingStatus: "open" | "shipping_pending" | "shipping_paid";
  chargedAmount: number;
  currency: string;
  order: OrderSummary & { shipmentGroupLabel?: string };
};

type CatalogSearchItem = {
  id: string;
  kind: "scheduled_lot" | "buy_now_product";
  itemId: string;
  itemTitle: string;
  itemCategory: string;
  queuePosition: number;
  sellerName: string;
  showId: string;
  showTitle: string;
  showStatus: "draft" | "scheduled" | "live" | "ended" | "cancelled";
  scheduledFor: string;
  priceLabel?: string;
  imageUrl?: string;
};

type MaxBidPreference = {
  showId: string;
  itemId: string;
  userId: string;
  buyerName: string;
  maxAmount: number;
  createdAt: string;
  updatedAt: string;
};

type ViewerPresence = {
  showId: string;
  viewerId: string;
  source?: "discover" | "live_show";
  lastSeenAt: string;
};

type ShowLike = {
  showId: string;
  userId: string;
  createdAt: string;
};

type BuyNowListing = {
  id: string;
  sellerName: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  createdAt: string;
};

type BuyNowOfferStatus = "pending" | "approved" | "rejected";

type BuyNowOffer = {
  id: string;
  listingId: string;
  sellerName: string;
  buyerId?: string;
  buyerName: string;
  productTitle: string;
  originalPrice: number;
  offerPrice: number;
  currency: string;
  status: BuyNowOfferStatus;
  createdAt: string;
  respondedAt?: string;
  orderId?: string;
};

type DirectMessageMetadata =
  | {
      kind: "buy_now_offer";
      offerId: string;
    }
  | undefined;

type DirectMessage = {
  id: string;
  participants: [string, string];
  author: string;
  authorProfile: string;
  recipientProfile: string;
  text: string;
  createdAt: string;
  metadata?: DirectMessageMetadata;
};

type PushTokenRegistration = {
  profileName: string;
  pushToken: string;
  updatedAt: string;
};

type UserProfileRecord = {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  dateOfBirth: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  updatedAt: string;
  usernameChangedAt?: string;
  preferredLocale?: "en" | "sk" | "cs";
  preferredCurrency?: "EUR" | "CZK";
  onboardingCompleted?: boolean;
  profileImageUrl?: string;
  bidReadinessReady?: boolean;
  bidReadinessStatus?: "not_ready" | "ready" | "payment_retry_required" | "restricted";
  bidDefaultShippingMethodId?: string;
  bidPaymentMethodToken?: string;
  bidAcceptsInstantLotCharges?: boolean;
  bidAcceptsGroupedShippingCharges?: boolean;
  bidShippingProvider?: "packeta" | "balikovna";
  bidPickupPointId?: string;
  bidPickupPointLabel?: string;
  bidShippingPrice?: number;
  bidTermsAcceptedAt?: string;
  sellerType?: "trader" | "non_trader";
  businessName?: string;
  companyId?: string;
  vatId?: string;
  feeAcceptedAt?: string;
  sellerTermsAcceptedAt?: string;
};

type ShipmentTrackingSnapshot = {
  provider: "packeta" | "balikovna" | "manual";
  trackingNumber: string;
  status: string;
  lastEvent?: string;
  lastEventAt?: string;
  updatedAt: string;
  source: "packeta_api" | "manual";
};

type PersistedOrderStore = {
  orders?: OrderSummary[];
  orderDetails?: Record<string, OrderDetail>;
  shipmentGroups?: ShipmentGroupSummary[];
  userProfiles?: UserProfileRecord[];
  bidReadinessByUserId?: Record<string, BuyerBidReadiness>;
  buyNowListings?: BuyNowListing[];
  buyNowOffers?: BuyNowOffer[];
  directMessages?: DirectMessage[];
  pushTokenRegistrations?: PushTokenRegistration[];
};

const postgresStoreKey = "orders:v1";
let postgresPool: pg.Pool | null = null;
let postgresStoreReady: Promise<pg.Pool | null> | null = null;

const persistedStorePath =
  process.env.BIDWAVE_STORE_PATH?.trim() ||
  (process.env.DATA_DIR?.trim()
    ? join(process.env.DATA_DIR.trim(), "bidwave-store.json")
    : join(process.cwd(), ".bidwave-data", "bidwave-store.json"));

function loadPersistedOrderStore(): PersistedOrderStore {
  if (!persistedStorePath || !existsSync(persistedStorePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(persistedStorePath, "utf8")) as PersistedOrderStore;
  } catch {
    return {};
  }
}

function persistOrderStore() {
  mkdirSync(dirname(persistedStorePath), { recursive: true });
  const temporaryPath = `${persistedStorePath}.tmp`;
  const payload = {
    orders: mockOrders,
    orderDetails: mockOrderDetails,
    shipmentGroups: mockShipmentGroups,
    userProfiles: mockUserProfiles,
    bidReadinessByUserId: mockBidReadinessByUserId,
    buyNowListings: mockBuyNowListings,
    buyNowOffers: mockBuyNowOffers,
    directMessages: mockDirectMessages,
    pushTokenRegistrations: mockPushTokenRegistrations
  } satisfies PersistedOrderStore;

  writeFileSync(
    temporaryPath,
    JSON.stringify(payload, null, 2)
  );
  renameSync(temporaryPath, persistedStorePath);

  void persistOrderStoreToPostgres(payload).catch((error) => {
    console.error("Failed to persist BidWave order store to Postgres", error);
  });
}

const persistedOrderStore = loadPersistedOrderStore();

async function getPostgresStore() {
  if (!process.env.DATABASE_URL?.trim()) {
    return null;
  }

  if (!postgresStoreReady) {
    postgresStoreReady = (async () => {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
      });

      await pool.query(`
        CREATE TABLE IF NOT EXISTS bidwave_runtime_store (
          store_key TEXT PRIMARY KEY,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      postgresPool = pool;
      return pool;
    })().catch((error) => {
      postgresStoreReady = null;
      console.error("Failed to initialize BidWave Postgres runtime store", error);
      return null;
    });
  }

  return postgresStoreReady;
}

function applyPersistedOrderStore(store: PersistedOrderStore) {
  if (store.shipmentGroups) {
    mockShipmentGroups.splice(0, mockShipmentGroups.length, ...store.shipmentGroups);
  }

  if (store.orders) {
    mockOrders.splice(0, mockOrders.length, ...store.orders);
  }

  if (store.orderDetails) {
    for (const key of Object.keys(mockOrderDetails)) {
      delete mockOrderDetails[key];
    }
    Object.assign(mockOrderDetails, store.orderDetails);
  }

  if (store.userProfiles) {
    mockUserProfiles.splice(0, mockUserProfiles.length, ...store.userProfiles);
  }

  if (store.bidReadinessByUserId) {
    for (const key of Object.keys(mockBidReadinessByUserId)) {
      delete mockBidReadinessByUserId[key];
    }
    Object.assign(mockBidReadinessByUserId, store.bidReadinessByUserId);
  }

  if (store.buyNowListings) {
    mockBuyNowListings.splice(0, mockBuyNowListings.length, ...store.buyNowListings);
  }

  if (store.buyNowOffers) {
    mockBuyNowOffers.splice(0, mockBuyNowOffers.length, ...store.buyNowOffers);
  }

  if (store.directMessages) {
    mockDirectMessages.splice(0, mockDirectMessages.length, ...store.directMessages);
  }

  if (store.pushTokenRegistrations) {
    mockPushTokenRegistrations.splice(0, mockPushTokenRegistrations.length, ...store.pushTokenRegistrations);
  }
}

async function loadOrderStoreFromPostgres() {
  const pool = await getPostgresStore();
  if (!pool) {
    return undefined;
  }

  const result = await pool.query<{ payload: PersistedOrderStore }>(
    "SELECT payload FROM bidwave_runtime_store WHERE store_key = $1",
    [postgresStoreKey]
  );

  return result.rows[0]?.payload;
}

async function persistOrderStoreToPostgres(payload: PersistedOrderStore) {
  const pool = await getPostgresStore();
  if (!pool) {
    return;
  }

  await pool.query(
    `
      INSERT INTO bidwave_runtime_store (store_key, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (store_key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    [postgresStoreKey, JSON.stringify(payload)]
  );
}

export async function initializePersistentOrderStore() {
  const store = await loadOrderStoreFromPostgres();
  if (store) {
    applyPersistedOrderStore(store);
  }
}

export const mockSellerApplications: SellerApplication[] = [
  {
    id: "sel_app_1",
    userId: "usr_seller_1",
    storeName: "CardCellar CZ",
    legalName: "CardCellar s.r.o.",
    countryCode: "CZ",
    categoryFocus: "Pokemon cards",
    status: "approved",
    payoutHoldDays: 7,
    createdAt: now
  }
];

export const mockShows: ShowSummary[] = [];

const mockShowItemsByShowId: Record<string, ShowItemSummary[]> = {};

const mockShowDescriptions: Record<string, string> = {};
const mockShowLineupHiddenByShowId: Record<string, boolean> = {};

const mockAuctionsByShowId: Record<string, AuctionState> = {};
const mockLastAuctionSettlementByShowId: Record<string, AuctionSettlementResult> = {};

function ensureAuctionState(showId: string) {
  const auction = mockAuctionsByShowId[showId];
  if (!auction) {
    return undefined;
  }

  if (auction.status !== "live") {
    return auction;
  }

  const endsAt = new Date(auction.endsAt).getTime();
  if (!Number.isFinite(endsAt) || endsAt > Date.now()) {
    return auction;
  }

  auction.status = "ended";
  auction.endsAt = new Date().toISOString();

  if (auction.highestBidderId && auction.highestBidderName) {
    settleMockAuctionLot({ showId });
  } else {
    const activeItem = mockShowItemsByShowId[showId]?.find((item) => item.id === auction.showItemId);
    if (activeItem) {
      activeItem.lotStatus = "sold";
    }
    mockShowItemsByShowId[showId] = (mockShowItemsByShowId[showId] ?? [])
      .filter((item) => item.id !== auction.showItemId)
      .map((item, index) => ({
        ...item,
        queuePosition: index + 1
      }));
    clearMaxBidsForItem(showId, auction.showItemId);
    delete mockRecentWinnerByShowId[showId];
    delete mockAuctionsByShowId[showId];
  }

  return mockAuctionsByShowId[showId];
}

function getNextQueuePosition(showId: string) {
  const items = mockShowItemsByShowId[showId] ?? [];
  return items.length + 1;
}

function getNextQueuedItem(showId: string) {
  const items = mockShowItemsByShowId[showId] ?? [];
  return items.find((item) => item.lotStatus === "queued");
}

const mockBidReadinessByUserId: Record<string, BuyerBidReadiness> = {
  "mobile-demo-user": {
    ready: false,
    status: "not_ready"
  },
  ...(persistedOrderStore.bidReadinessByUserId ?? {})
};

const mockMaxBidPreferences: MaxBidPreference[] = [];

const mockShipmentGroups: ShipmentGroupSummary[] = persistedOrderStore.shipmentGroups ?? [];
const mockViewerPresence: ViewerPresence[] = [];
const mockShowLikes: ShowLike[] = [];
const mockBuyNowListings: BuyNowListing[] = persistedOrderStore.buyNowListings ?? [];
const mockBuyNowOffers: BuyNowOffer[] = persistedOrderStore.buyNowOffers ?? [];
const mockDirectMessages: DirectMessage[] = persistedOrderStore.directMessages ?? [];
const mockPushTokenRegistrations: PushTokenRegistration[] = persistedOrderStore.pushTokenRegistrations ?? [];
const mockUserProfiles: UserProfileRecord[] = persistedOrderStore.userProfiles ?? [];

function sanitizeUserProfile(profile: UserProfileRecord) {
  return Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined)
  ) as UserProfileRecord;
}

function findShipmentGroupByOrderId(orderId: string) {
  if (orderId.startsWith("sold_")) {
    const shipmentGroupId = orderId.replace(/^sold_/, "");
    return mockShipmentGroups.find((group) => group.id === shipmentGroupId);
  }

  if (orderId.startsWith("ord_ship_group_")) {
    const shipmentGroupId = orderId.replace(/^ord_/, "");
    return mockShipmentGroups.find((group) => group.id === shipmentGroupId);
  }

  return undefined;
}

function statusForShipmentGroup(group: ShipmentGroupSummary): OrderSummary["status"] {
  if (group.shipmentStatus === "delivered_confirmed") {
    return "delivered";
  }

  if (group.trackingNumber || group.shipmentStatus === "tracking_added") {
    return "shipped";
  }

  if (group.paymentStatus === "captured") {
    return "fulfillment_pending";
  }

  return "pending_payment";
}

function shippingInstructionForGroup(group: ShipmentGroupSummary) {
  const destination = group.pickupPointLabel ? ` Buyer pickup point: ${group.pickupPointLabel}.` : "";
  if (group.deliveryProvider === "packeta") {
    return `Send via Packeta using the buyer default pickup/delivery option.${destination}`;
  }

  if (group.deliveryProvider === "balikovna") {
    return `Send via Balíkovňa using the buyer default pickup/delivery option.${destination}`;
  }

  return `Use the buyer default shipping method, then add the tracking number here.${destination}`;
}

function syncShipmentGroupToOrders(group: ShipmentGroupSummary) {
  const soldOrderId = `sold_${group.id}`;
  const wonOrderId = `ord_${group.id}`;
  const status = statusForShipmentGroup(group);
  const totalAmount = Number((group.totalAmount + group.shippingAmount).toFixed(2));

  const applySummary = (order: OrderSummary) => {
    order.status = status;
    order.totalAmount = totalAmount;
    order.itemTitles = [...group.itemTitles];
    order.shippingAmount = group.shippingAmount;
    order.shippingMethodLabel = group.shippingMethodLabel;
    order.pickupPointId = group.pickupPointId;
    order.pickupPointLabel = group.pickupPointLabel;
    order.trackingNumber = group.trackingNumber;
    order.deliveryProvider = group.deliveryProvider;
    order.trackingStatus = group.trackingStatus;
    order.trackingLastEvent = group.trackingLastEvent;
    order.trackingLastEventAt = group.trackingLastEventAt;
    order.paymentStatus = group.paymentStatus;
    order.shipmentStatus = group.shipmentStatus;
    order.sellerPayoutStatus = group.sellerPayoutStatus;
    order.shippingInstruction = shippingInstructionForGroup(group);
  };

  for (const order of mockOrders) {
    if (order.id === wonOrderId || order.id === soldOrderId) {
      applySummary(order);
    }
  }

  if (mockOrderDetails[wonOrderId]) {
    mockOrderDetails[wonOrderId] = {
      ...mockOrderDetails[wonOrderId],
      status,
      totalAmount,
      itemTitles: [...group.itemTitles],
      shippingMethodLabel: group.shippingMethodLabel,
      pickupPointId: group.pickupPointId,
      pickupPointLabel: group.pickupPointLabel,
      lineItems: [
        ...group.itemTitles.map((title, index) => ({
          title,
          pricingMode: "auction" as const,
          amount: group.itemAmounts[index] ?? 0
        })),
        ...(group.shippingAmount > 0
          ? [
              {
                title: "Shipping",
                pricingMode: "buy_now" as const,
                amount: group.shippingAmount
              }
            ]
          : [])
      ],
      paymentStatus: group.paymentStatus,
      shipmentStatus: group.shipmentStatus,
      trackingNumber: group.trackingNumber,
      deliveryProvider: group.deliveryProvider,
      trackingStatus: group.trackingStatus,
      trackingLastEvent: group.trackingLastEvent,
      trackingLastEventAt: group.trackingLastEventAt,
      sellerPayoutStatus: group.sellerPayoutStatus,
      shippingInstruction: shippingInstructionForGroup(group)
    } as OrderDetail;
  }
}

const mockRecentWinnerByShowId: Record<
  string,
  {
    itemId: string;
    itemTitle: string;
    winnerName: string;
    amount: number;
    settledAt: string;
  }
> = {};

export const mockOrders: OrderSummary[] = persistedOrderStore.orders ?? [];

const mockOrderDetails: Record<string, OrderDetail> = persistedOrderStore.orderDetails ?? {};

const normalizeProfileName = (value: string) => value.trim().toLowerCase();
const directThreadParticipants = (left: string, right: string): [string, string] => {
  const pair = [normalizeProfileName(left), normalizeProfileName(right)].sort();
  return [pair[0], pair[1]];
};

export function listSellerApplications() {
  return mockSellerApplications;
}

export function createSellerApplication(
  input: Omit<SellerApplication, "id" | "status" | "payoutHoldDays" | "createdAt">
) {
  const application: SellerApplication = {
    id: `sel_app_${mockSellerApplications.length + 1}`,
    status: "pending_review",
    payoutHoldDays: 7,
    createdAt: new Date().toISOString(),
    ...input
  };

  mockSellerApplications.push(application);
  return application;
}

export function getSellerDashboardSummary(sellerId: string): SellerDashboardSummary {
  const application =
    mockSellerApplications.find((item) => item.userId === sellerId) ??
    mockSellerApplications[0];

  const sellerShows = mockShows.filter((show) => show.sellerId === application.userId);
  const sellerOrders = mockOrders.filter((order) => order.sellerName === application.storeName);

  return {
    sellerId: application.userId,
    storeName: application.storeName,
    status: application.status,
    upcomingShows: sellerShows.filter((show) => show.status === "scheduled").length,
    liveShows: sellerShows.filter((show) => show.status === "live").length,
    totalOrders: sellerOrders.length,
    grossMerchandiseValue: sellerOrders.reduce((sum, order) => sum + order.totalAmount, 0),
    payoutHoldDays: application.payoutHoldDays
  };
}

export function listSellerShows(sellerId: string) {
  return mockShows.filter((show) => show.sellerId === sellerId);
}

export function countShowLikes(showId: string) {
  return mockShowLikes.filter((entry) => entry.showId === showId).length;
}

export function isShowLikedByUser(showId: string, userId?: string) {
  if (!userId) {
    return false;
  }

  return mockShowLikes.some((entry) => entry.showId === showId && entry.userId === userId);
}

export function toggleShowLike(showId: string, userId: string) {
  const show = mockShows.find((entry) => entry.id === showId);
  if (!show) {
    return undefined;
  }

  const existingIndex = mockShowLikes.findIndex(
    (entry) => entry.showId === showId && entry.userId === userId
  );

  if (existingIndex >= 0) {
    mockShowLikes.splice(existingIndex, 1);
    return {
      showId,
      liked: false,
      likeCount: countShowLikes(showId)
    };
  }

  mockShowLikes.push({
    showId,
    userId,
    createdAt: new Date().toISOString()
  });

  return {
    showId,
    liked: true,
    likeCount: countShowLikes(showId)
  };
}

export function createShow(
  input: Pick<ShowSummary, "title" | "sellerId" | "sellerName" | "scheduledFor" | "lineupHidden">
) {
  const show: ShowSummary = {
    id: `show_${mockShows.length + 1}`,
    status: "scheduled",
    ...input
  };

  mockShows.push(show);
  mockShowItemsByShowId[show.id] = [];
  mockShowDescriptions[show.id] = "Fresh stream lineup ready for queue planning and live lot control.";
  mockShowLineupHiddenByShowId[show.id] = input.lineupHidden ?? false;
  return show;
}

export function updateShow(input: {
  showId: string;
  title: string;
  description: string;
  scheduledFor: string;
  lineupHidden?: boolean;
}) {
  const show = mockShows.find((item) => item.id === input.showId);
  if (!show) {
    return undefined;
  }

  if (show.status === "live") {
    return null;
  }

  show.title = input.title;
  show.scheduledFor = input.scheduledFor;
  show.lineupHidden = input.lineupHidden ?? show.lineupHidden ?? false;
  mockShowDescriptions[input.showId] = input.description;
  mockShowLineupHiddenByShowId[input.showId] = input.lineupHidden ?? mockShowLineupHiddenByShowId[input.showId] ?? false;
  return show;
}

export function cancelShow(showId: string) {
  const showIndex = mockShows.findIndex((item) => item.id === showId);
  if (showIndex === -1) {
    return undefined;
  }

  const show = mockShows[showIndex];
  if (show.status === "live") {
    return null;
  }

  mockShows.splice(showIndex, 1);
  delete mockShowItemsByShowId[showId];
  delete mockShowDescriptions[showId];
  delete mockAuctionsByShowId[showId];
  delete mockShowLineupHiddenByShowId[showId];

  return show;
}

export function endStream(showId: string) {
  const show = mockShows.find((item) => item.id === showId);
  if (!show) {
    return undefined;
  }

  show.status = "ended";
  const auction = mockAuctionsByShowId[showId];
  if (auction) {
    auction.status = "ended";
    auction.endsAt = new Date().toISOString();
    if (auction.highestBidderId && auction.highestBidderName) {
      settleMockAuctionLot({ showId });
    }
  }

  const activeItems = mockShowItemsByShowId[showId] ?? [];
  activeItems.forEach((item) => {
    if (item.lotStatus === "live") {
      item.lotStatus = "sold";
    }
  });

  mockShipmentGroups
    .filter((group) => group.showId === showId && group.paymentStatus === "pending_capture")
    .forEach((group) => {
      group.paymentStatus = "captured";
      group.shipmentStatus = group.trackingNumber ? "tracking_added" : "needs_shipping";
      group.sellerPayoutStatus = "held";
      group.shippingStatus = "shipping_pending";
      group.trackingStatus = group.trackingNumber ? (group.trackingStatus ?? "tracking_added") : "needs_shipping";
      group.trackingLastEvent = group.trackingNumber
        ? (group.trackingLastEvent ?? "Tracking number was added")
        : "Payment captured after stream ended. Seller needs to ship.";
      group.trackingLastEventAt = new Date().toISOString();
      syncShipmentGroupToOrders(group);
    });
  persistOrderStore();

  return show;
}

export function goLive(showId: string) {
  const show = mockShows.find((item) => item.id === showId);
  if (!show) {
    return undefined;
  }

  if (show.status === "live") {
    return show;
  }

  show.status = "live";

  delete mockAuctionsByShowId[showId];

  return show;
}

export function listSellerOrders(sellerName: string) {
  return listBuyerOrders({ sellerName });
}

export function getShowDetail(
  showId: string,
  userId?: string
): (ShowDetail & { likeCount: number; likedByUser: boolean }) | undefined {
  ensureAuctionState(showId);
  const show = mockShows.find((item) => item.id === showId);
  const auction = mockAuctionsByShowId[showId];

  if (!show) {
    return undefined;
  }

  const streamGroups = mockShipmentGroups.filter(
    (group) => group.showId === showId && group.paymentStatus !== "pending_capture"
  );
  const grossRevenue = streamGroups.reduce((sum, group) => sum + group.totalAmount, 0);

  return {
    ...show,
    lineupHidden: mockShowLineupHiddenByShowId[showId] ?? show.lineupHidden ?? false,
    description: mockShowDescriptions[showId] ?? "Show detail coming soon.",
    viewers: countActiveViewers(showId),
    coverImage:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    items: mockShowItemsByShowId[showId] ?? [],
    activeItemId: auction?.status === "live" ? auction.showItemId : undefined,
    streamRoomId: `room_${showId}`,
    grossRevenue,
    netRevenue: Number((grossRevenue * 0.92).toFixed(2)),
    recentWinner: mockRecentWinnerByShowId[showId],
    likeCount: countShowLikes(showId),
    likedByUser: isShowLikedByUser(showId, userId)
  };
}

function pruneViewerPresence(showId?: string) {
  const cutoff = Date.now() - VIEWER_HEARTBEAT_TTL_MS;
  for (let index = mockViewerPresence.length - 1; index >= 0; index -= 1) {
    const entry = mockViewerPresence[index];
    const lastSeen = new Date(entry.lastSeenAt).getTime();
    if (!Number.isFinite(lastSeen) || lastSeen < cutoff || (showId && entry.showId === showId && lastSeen < cutoff)) {
      mockViewerPresence.splice(index, 1);
    }
  }
}

export function countActiveViewers(showId: string) {
  pruneViewerPresence(showId);
  return mockViewerPresence.filter((entry) => entry.showId === showId).length;
}

export function touchViewerPresence(input: {
  showId: string;
  viewerId: string;
  source?: "discover" | "live_show";
}) {
  pruneViewerPresence(input.showId);
  const existing = mockViewerPresence.find(
    (entry) => entry.showId === input.showId && entry.viewerId === input.viewerId
  );
  const lastSeenAt = new Date().toISOString();
  if (existing) {
    existing.lastSeenAt = lastSeenAt;
    existing.source = input.source;
    return existing;
  }

  const created: ViewerPresence = {
    showId: input.showId,
    viewerId: input.viewerId,
    source: input.source,
    lastSeenAt
  };
  mockViewerPresence.push(created);
  return created;
}

export function clearViewerPresence(showId: string, viewerId: string) {
  const index = mockViewerPresence.findIndex(
    (entry) => entry.showId === showId && entry.viewerId === viewerId
  );
  if (index === -1) {
    return false;
  }
  mockViewerPresence.splice(index, 1);
  return true;
}

export function getAuctionByShowId(showId: string) {
  ensureAuctionState(showId);
  return mockAuctionsByShowId[showId];
}

function getSavedMaxBid(showId: string, itemId: string, userId: string) {
  return mockMaxBidPreferences.find(
    (entry) => entry.showId === showId && entry.itemId === itemId && entry.userId === userId
  );
}

function clearMaxBidsForItem(showId: string, itemId?: string) {
  if (!itemId) {
    return;
  }

  for (let index = mockMaxBidPreferences.length - 1; index >= 0; index -= 1) {
    const entry = mockMaxBidPreferences[index];
    if (entry.showId === showId && entry.itemId === itemId) {
      mockMaxBidPreferences.splice(index, 1);
    }
  }
}

function resolveAutomaticMaxBids(showId: string, leaderUserId: string, leaderName: string) {
  const auction = mockAuctionsByShowId[showId];
  if (!auction || auction.status !== "live") {
    return auction;
  }

  const itemId = auction.showItemId;
  let currentLeaderId = leaderUserId;
  let currentLeaderName = leaderName;
  let currentLeaderMax = Math.max(
    getSavedMaxBid(showId, itemId, currentLeaderId)?.maxAmount ?? 0,
    auction.currentPrice
  );

  for (;;) {
    const minimumValidAmount = auction.currentPrice + auction.minimumIncrement;
    const challenger = mockMaxBidPreferences
      .filter(
        (entry) =>
          entry.showId === showId &&
          entry.itemId === itemId &&
          entry.userId !== currentLeaderId &&
          entry.maxAmount >= minimumValidAmount
      )
      .sort((left, right) => {
        if (right.maxAmount !== left.maxAmount) {
          return right.maxAmount - left.maxAmount;
        }

        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      })[0];

    if (!challenger) {
      break;
    }

    if (challenger.maxAmount <= currentLeaderMax) {
      const nextAmount = Math.min(currentLeaderMax, challenger.maxAmount + auction.minimumIncrement);
      if (nextAmount > auction.currentPrice) {
        auction.currentPrice = nextAmount;
        auction.highestBidderId = currentLeaderId;
        auction.highestBidderName = currentLeaderName;
        auction.bidCount += 1;
      }
      break;
    }

    const nextAmount = Math.min(challenger.maxAmount, currentLeaderMax + auction.minimumIncrement);
    if (nextAmount <= auction.currentPrice) {
      break;
    }

    auction.currentPrice = nextAmount;
    auction.highestBidderId = challenger.userId;
    auction.highestBidderName = challenger.buyerName;
    auction.bidCount += 1;

    currentLeaderId = challenger.userId;
    currentLeaderName = challenger.buyerName;
    currentLeaderMax = challenger.maxAmount;
  }

  return auction;
}

export function listMaxBidsForUser(userId: string) {
  return mockMaxBidPreferences.filter((entry) => entry.userId === userId);
}

export function getMaxBidForUser(showId: string, itemId: string, userId: string) {
  return getSavedMaxBid(showId, itemId, userId);
}

export function saveMaxBidForUser(input: {
  showId: string;
  itemId: string;
  userId: string;
  buyerName: string;
  maxAmount: number;
}) {
  const timestamp = new Date().toISOString();
  const existing = getSavedMaxBid(input.showId, input.itemId, input.userId);

  if (existing) {
    existing.maxAmount = input.maxAmount;
    existing.buyerName = input.buyerName;
    existing.updatedAt = timestamp;
    return existing;
  }

  const created: MaxBidPreference = {
    showId: input.showId,
    itemId: input.itemId,
    userId: input.userId,
    buyerName: input.buyerName,
    maxAmount: input.maxAmount,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  mockMaxBidPreferences.push(created);
  return created;
}

export function clearMaxBidForUser(showId: string, itemId: string, userId: string) {
  const index = mockMaxBidPreferences.findIndex(
    (entry) => entry.showId === showId && entry.itemId === itemId && entry.userId === userId
  );

  if (index === -1) {
    return false;
  }

  mockMaxBidPreferences.splice(index, 1);
  return true;
}

export function placeMockBid(showId: string, amount: number, userId = "mobile-demo-user", buyerName = "You") {
  const auction = ensureAuctionState(showId);

  if (!auction || auction.status !== "live") {
    return undefined;
  }

  if (auction.highestBidderId === userId) {
    return {
      accepted: false,
      minimumValidAmount: auction.currentPrice + auction.minimumIncrement,
      reason: "already_highest_bidder" as const,
      auction
    };
  }

  const minimumValidAmount = auction.currentPrice + auction.minimumIncrement;
  const accepted = amount >= minimumValidAmount;

  if (accepted) {
    auction.currentPrice = amount;
    auction.highestBidderId = userId;
    auction.highestBidderName = buyerName;
    auction.bidCount += 1;
    const remainingMs = new Date(auction.endsAt).getTime() - Date.now();
    if (Number.isFinite(remainingMs) && remainingMs <= EXTENSION_WINDOW_MS) {
      auction.endsAt = new Date(Date.now() + EXTENSION_INCREMENT_MS).toISOString();
    }
    resolveAutomaticMaxBids(showId, userId, buyerName);
  }

  return {
    accepted,
    minimumValidAmount,
    reason: accepted ? undefined : ("bid_too_low" as const),
    auction
  };
}

export function closeMockAuction(showId: string) {
  const auction = ensureAuctionState(showId) ?? mockAuctionsByShowId[showId];

  if (!auction) {
    return undefined;
  }

  auction.status = "ended";
  auction.endsAt = new Date().toISOString();
  const activeItem = mockShowItemsByShowId[showId]?.find((item) => item.id === auction.showItemId);
  if (activeItem) {
    activeItem.lotStatus = "sold";
  }
  clearMaxBidsForItem(showId, auction.showItemId);
  return auction;
}

export function closeAndSettleMockAuctionLot(input: { showId: string; userId?: string; buyerName?: string }) {
  const show = mockShows.find((item) => item.id === input.showId);
  const auction = mockAuctionsByShowId[input.showId];

  if (!show || !auction) {
    return mockLastAuctionSettlementByShowId[input.showId];
  }

  auction.status = "ended";
  auction.endsAt = new Date().toISOString();

  const activeItem = mockShowItemsByShowId[input.showId]?.find((item) => item.id === auction.showItemId);
  if (!activeItem) {
    return null;
  }

  if (!auction.highestBidderId || !auction.highestBidderName) {
    activeItem.lotStatus = "sold";
    clearMaxBidsForItem(input.showId, auction.showItemId);
    mockShowItemsByShowId[input.showId] = (mockShowItemsByShowId[input.showId] ?? [])
      .filter((item) => item.id !== auction.showItemId)
      .map((item, index) => ({
        ...item,
        queuePosition: index + 1
      }));
    delete mockAuctionsByShowId[input.showId];
    delete mockRecentWinnerByShowId[input.showId];
    const emptySettlement: AuctionSettlementResult = {
      shipmentGroupId: `stream-${input.showId}`,
      shippingStatus: "open" as const,
      chargedAmount: 0,
      currency: activeItem.currency ?? "EUR",
      order: {
        id: `ord_none_${Date.now()}`,
        buyerName: "",
        sellerName: show.sellerName,
        showTitle: show.title,
        status: "paid" as const,
        totalAmount: 0,
        currency: activeItem.currency ?? "EUR",
        placedAt: new Date().toISOString(),
        showId: show.id,
        buyerId: undefined,
        sellerId: show.sellerId,
        orderType: "won" as const,
        itemTitles: [activeItem.title],
        shippingAmount: 0,
        shipmentGroupLabel: `${show.title} · 0 lots`
      }
    };
    mockLastAuctionSettlementByShowId[input.showId] = emptySettlement;
    return emptySettlement;
  }

  return settleMockAuctionLot(input);
}

export function listShowQueue(showId: string) {
  return (mockShowItemsByShowId[showId] ?? []).slice().sort((left, right) => {
    return (left.queuePosition ?? 0) - (right.queuePosition ?? 0);
  });
}

export function addShowQueueItem(input: {
  showId: string;
  title: string;
  category: string;
  pricingMode: "auction" | "buy_now";
  imageUrl?: string;
  startPrice?: number;
  buyNowPrice?: number;
  currency?: string;
}) {
  const show = mockShows.find((item) => item.id === input.showId);
  if (!show) {
    return undefined;
  }

  const items = mockShowItemsByShowId[input.showId] ?? [];
  const created: ShowItemSummary = {
    id: `item_${Date.now()}`,
    title: input.title,
    category: input.category,
    pricingMode: input.pricingMode,
    imageUrl: input.imageUrl,
    startPrice: input.startPrice,
    buyNowPrice: input.buyNowPrice,
    currency: input.currency ?? "EUR",
    queuePosition: getNextQueuePosition(input.showId),
    lotStatus: "queued"
  };

  if (!mockShowItemsByShowId[input.showId]) {
    mockShowItemsByShowId[input.showId] = [];
  }

  mockShowItemsByShowId[input.showId].push(created);
  return created;
}

export function moveQueueItem(input: { showId: string; itemId: string; direction: "up" | "down" }) {
  const items = mockShowItemsByShowId[input.showId];
  if (!items) {
    return undefined;
  }

  const sorted = items.slice().sort((left, right) => (left.queuePosition ?? 0) - (right.queuePosition ?? 0));
  const index = sorted.findIndex((item) => item.id === input.itemId);
  if (index === -1) {
    return undefined;
  }

  const targetIndex = input.direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return sorted;
  }

  const current = sorted[index];
  const target = sorted[targetIndex];
  const currentPosition = current.queuePosition ?? index + 1;
  current.queuePosition = target.queuePosition ?? targetIndex + 1;
  target.queuePosition = currentPosition;

  mockShowItemsByShowId[input.showId] = sorted;
  return listShowQueue(input.showId);
}

export function removeQueueItem(input: { showId: string; itemId: string }) {
  const items = mockShowItemsByShowId[input.showId];
  if (!items) {
    return undefined;
  }

  const nextItems = items.filter((item) => item.id !== input.itemId);
  if (nextItems.length === items.length) {
    return undefined;
  }

  mockShowItemsByShowId[input.showId] = nextItems.map((item, index) => ({
    ...item,
    queuePosition: index + 1
  }));

  return listShowQueue(input.showId);
}

export function startNextQueuedAuction(showId: string) {
  const existingAuction = ensureAuctionState(showId);
  const show = mockShows.find((item) => item.id === showId);
  if (!show) {
    return undefined;
  }

  if (existingAuction?.status === "live") {
    return null;
  }

  if (existingAuction) {
    delete mockAuctionsByShowId[showId];
  }
  delete mockRecentWinnerByShowId[showId];
  delete mockLastAuctionSettlementByShowId[showId];

  const nextItem = getNextQueuedItem(showId);
  if (!nextItem) {
    return null;
  }

  nextItem.lotStatus = "live";
  show.status = "live";

  mockAuctionsByShowId[showId] = {
    id: `auc_${showId}`,
    showId,
    showItemId: nextItem.id,
    status: "live",
    startPrice: nextItem.pricingMode === "buy_now" ? nextItem.buyNowPrice ?? 5 : nextItem.startPrice ?? 5,
    currentPrice: nextItem.pricingMode === "buy_now" ? nextItem.buyNowPrice ?? 5 : nextItem.startPrice ?? 5,
    minimumIncrement: 2.5,
    endsAt: new Date(Date.now() + LOT_DURATION_MS).toISOString(),
    highestBidderId: undefined,
    highestBidderName: undefined,
    bidCount: 0
  };

  return {
    showId,
    activeItemId: nextItem.id,
    auction: mockAuctionsByShowId[showId],
    items: listShowQueue(showId)
  };
}

export function searchCatalog(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const scheduledMatches = Object.entries(mockShowItemsByShowId)
    .flatMap(([showId, items]) => {
      const show = mockShows.find((item) => item.id === showId);
      if (!show) {
        return [];
      }

      if (mockShowLineupHiddenByShowId[showId] ?? show.lineupHidden) {
        return [];
      }

      return items
        .filter((item) => item.title.toLowerCase().includes(normalized) || item.category.toLowerCase().includes(normalized))
        .map<CatalogSearchItem>((item) => ({
          id: `${showId}_${item.id}`,
          kind: "scheduled_lot",
          itemId: item.id,
          itemTitle: item.title,
          itemCategory: item.category,
          queuePosition: item.queuePosition ?? 0,
          sellerName: show.sellerName,
          showId: show.id,
          showTitle: show.title,
          showStatus: show.status,
          scheduledFor: show.scheduledFor
        }));
    })
    .sort((left, right) => left.queuePosition - right.queuePosition);

  const buyNowMatches = mockBuyNowListings
    .filter(
      (item) =>
        item.title.toLowerCase().includes(normalized) || item.sellerName.toLowerCase().includes(normalized)
    )
    .map<CatalogSearchItem>((item) => ({
      id: `buy_now_${item.id}`,
      kind: "buy_now_product",
      itemId: item.id,
      itemTitle: item.title,
      itemCategory: "Buy now",
      queuePosition: 0,
      sellerName: item.sellerName,
      showId: "",
      showTitle: "",
      showStatus: "scheduled",
      scheduledFor: item.createdAt,
      priceLabel: `${item.price.toFixed(2)} ${item.currency}`,
      imageUrl: item.imageUrl
    }));

  return [...scheduledMatches, ...buyNowMatches];
}

export function listBuyNowListings(sellerName?: string) {
  if (!sellerName) {
    return [...mockBuyNowListings].sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  }

  return mockBuyNowListings
    .filter((item) => normalizeProfileName(item.sellerName) === normalizeProfileName(sellerName))
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

export function createBuyNowListing(input: {
  sellerName: string;
  title: string;
  price: number;
  currency?: string;
  imageUrl?: string;
}) {
  const created: BuyNowListing = {
    id: `buy_now_${Date.now()}`,
    sellerName: input.sellerName,
    title: input.title,
    price: input.price,
    currency: input.currency ?? "EUR",
    imageUrl: input.imageUrl,
    createdAt: new Date().toISOString()
  };

  mockBuyNowListings.unshift(created);
  persistOrderStore();
  return created;
}

export function deleteBuyNowListing(listingId: string) {
  const index = mockBuyNowListings.findIndex((item) => item.id === listingId);
  if (index === -1) {
    return undefined;
  }

  const [removed] = mockBuyNowListings.splice(index, 1);
  persistOrderStore();
  return removed;
}

function buyNowOfferText(offer: BuyNowOffer, status: BuyNowOfferStatus = offer.status) {
  if (status === "approved") {
    return `Offer approved for "${offer.productTitle}". Original: ${offer.originalPrice.toFixed(2)} ${offer.currency}. Approved price: ${offer.offerPrice.toFixed(2)} ${offer.currency}.`;
  }

  if (status === "rejected") {
    return `Offer rejected for "${offer.productTitle}". Original: ${offer.originalPrice.toFixed(2)} ${offer.currency}. Offered price: ${offer.offerPrice.toFixed(2)} ${offer.currency}.`;
  }

  return `Buy now offer for "${offer.productTitle}". Original price: ${offer.originalPrice.toFixed(2)} ${offer.currency}. Offer: ${offer.offerPrice.toFixed(2)} ${offer.currency}.`;
}

function decorateDirectMessage(message: DirectMessage) {
  if (message.metadata?.kind !== "buy_now_offer") {
    return message;
  }

  const offer = mockBuyNowOffers.find((item) => item.id === message.metadata?.offerId);
  return {
    ...message,
    offer
  };
}

function createBuyNowOrderFromOffer(offer: BuyNowOffer) {
  const placedAt = new Date().toISOString();
  const buyerId = offer.buyerId?.trim() || normalizeProfileName(offer.buyerName);
  const readiness = getBuyerBidReadiness(buyerId);
  const shipmentGroupId = `ship_group_${buyerId}_buy_now_${offer.listingId}`;
  const existingShipmentGroup = mockShipmentGroups.find((group) => group.id === shipmentGroupId);

  if (existingShipmentGroup) {
    return `ord_${shipmentGroupId}`;
  }

  mockShipmentGroups.unshift({
    id: shipmentGroupId,
    buyerId,
    sellerId: normalizeProfileName(offer.sellerName),
    sellerName: offer.sellerName,
    showId: `buy_now_${offer.listingId}`,
    showTitle: `Buy now · ${offer.productTitle}`,
    shippingStatus: "open",
    lotCount: 1,
    buyerName: offer.buyerName,
    itemTitles: [offer.productTitle],
    itemAmounts: [offer.offerPrice],
    totalAmount: offer.offerPrice,
    shippingAmount: readiness.shippingPrice ?? 0,
    shippingMethodLabel: readiness.shippingMethodLabel,
    pickupPointId: readiness.pickupPointId,
    pickupPointLabel: readiness.pickupPointLabel,
    currency: offer.currency,
    paymentStatus: "captured",
    shipmentStatus: "needs_shipping",
    sellerPayoutStatus: "held",
    deliveryProvider: readiness.shippingProvider,
    placedAt
  });

  const shipmentGroup = mockShipmentGroups.find((group) => group.id === shipmentGroupId)!;
  const orderId = `ord_${shipmentGroupId}`;
  const grandTotal = Number((shipmentGroup.totalAmount + shipmentGroup.shippingAmount).toFixed(2));
  const orderSummary: OrderSummary = {
    id: orderId,
    buyerName: offer.buyerName,
    sellerName: offer.sellerName,
    status: statusForShipmentGroup(shipmentGroup),
    totalAmount: grandTotal,
    currency: offer.currency,
    placedAt,
    showId: shipmentGroup.showId,
    showTitle: shipmentGroup.showTitle,
    buyerId,
    sellerId: shipmentGroup.sellerId,
    orderType: "won",
    itemTitles: [offer.productTitle],
    shippingAmount: shipmentGroup.shippingAmount,
    shippingMethodLabel: shipmentGroup.shippingMethodLabel,
    pickupPointId: shipmentGroup.pickupPointId,
    pickupPointLabel: shipmentGroup.pickupPointLabel,
    paymentStatus: shipmentGroup.paymentStatus,
    shipmentStatus: shipmentGroup.shipmentStatus,
    sellerPayoutStatus: shipmentGroup.sellerPayoutStatus,
    shippingInstruction: shippingInstructionForGroup(shipmentGroup)
  };

  mockOrders.unshift(orderSummary);
  mockOrderDetails[orderId] = {
    ...orderSummary,
    showTitle: shipmentGroup.showTitle,
    lineItems: [
      {
        title: offer.productTitle,
        pricingMode: "buy_now",
        amount: offer.offerPrice
      }
    ],
    paymentStatus: shipmentGroup.paymentStatus,
    shipmentStatus: shipmentGroup.shipmentStatus
  };

  if (shipmentGroup.shippingAmount > 0) {
    mockOrderDetails[orderId].lineItems.push({
      title: "Shipping",
      pricingMode: "buy_now",
      amount: shipmentGroup.shippingAmount
    });
  }

  syncShipmentGroupToOrders(shipmentGroup);
  return orderId;
}

export function createBuyNowOffer(input: {
  listingId: string;
  buyerId?: string;
  buyerName: string;
  offerPrice: number;
}) {
  const listing = mockBuyNowListings.find((item) => item.id === input.listingId);
  if (!listing) {
    return undefined;
  }

  if (input.offerPrice <= 0 || input.offerPrice > listing.price) {
    return null;
  }

  const created: BuyNowOffer = {
    id: `offer_${Date.now()}`,
    listingId: listing.id,
    sellerName: listing.sellerName,
    buyerId: input.buyerId,
    buyerName: input.buyerName.trim(),
    productTitle: listing.title,
    originalPrice: listing.price,
    offerPrice: Number(input.offerPrice.toFixed(2)),
    currency: listing.currency,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  mockBuyNowOffers.unshift(created);
  sendDirectMessage({
    from: created.buyerName,
    to: created.sellerName,
    text: buyNowOfferText(created),
    metadata: {
      kind: "buy_now_offer",
      offerId: created.id
    }
  });
  persistOrderStore();
  return created;
}

export function respondToBuyNowOffer(input: {
  offerId: string;
  sellerName: string;
  decision: "approve" | "reject";
}) {
  const offer = mockBuyNowOffers.find((item) => item.id === input.offerId);
  if (!offer) {
    return undefined;
  }

  if (normalizeProfileName(offer.sellerName) !== normalizeProfileName(input.sellerName)) {
    return null;
  }

  if (offer.status !== "pending") {
    return offer;
  }

  offer.status = input.decision === "approve" ? "approved" : "rejected";
  offer.respondedAt = new Date().toISOString();

  if (offer.status === "approved") {
    offer.orderId = createBuyNowOrderFromOffer(offer);
    deleteBuyNowListing(offer.listingId);
  }

  sendDirectMessage({
    from: offer.sellerName,
    to: offer.buyerName,
    text: buyNowOfferText(offer, offer.status),
    metadata: {
      kind: "buy_now_offer",
      offerId: offer.id
    }
  });

  persistOrderStore();
  return offer;
}

export function listDirectMessageThreads(profileName: string) {
  const normalizedProfileName = normalizeProfileName(profileName);
  const threads = new Map<
    string,
    {
      counterpartName: string;
      messages: DirectMessage[];
      lastMessage?: DirectMessage;
    }
  >();

  mockDirectMessages
    .filter((message) => message.participants.includes(normalizedProfileName))
    .forEach((message) => {
      const counterpartName =
        message.authorProfile === normalizedProfileName ? message.recipientProfile : message.author;
      const threadKey = directThreadParticipants(normalizedProfileName, counterpartName).join("::");
      const existing = threads.get(threadKey) ?? { counterpartName, messages: [] as DirectMessage[] };
      existing.messages.push(message);
      existing.lastMessage = decorateDirectMessage(message);
      threads.set(threadKey, existing);
    });

  return [...threads.values()]
    .map((thread) => ({
      counterpartName: thread.counterpartName,
      lastMessage: thread.lastMessage,
      messageCount: thread.messages.length
    }))
    .sort((left, right) => {
      const leftTime = left.lastMessage ? Date.parse(left.lastMessage.createdAt) : 0;
      const rightTime = right.lastMessage ? Date.parse(right.lastMessage.createdAt) : 0;
      return rightTime - leftTime;
    });
}

export function listDirectMessages(profileName: string, counterpartName: string) {
  const participants = directThreadParticipants(profileName, counterpartName);
  return mockDirectMessages
    .filter(
      (message) => message.participants[0] === participants[0] && message.participants[1] === participants[1]
    )
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
    .map((message) => decorateDirectMessage({
      ...message,
      author: message.author
    }));
}

export function sendDirectMessage(input: { from: string; to: string; text: string; metadata?: DirectMessageMetadata }) {
  const participants = directThreadParticipants(input.from, input.to);
  const created: DirectMessage = {
    id: `dm_${Date.now()}`,
    participants,
    author: input.from.trim(),
    authorProfile: normalizeProfileName(input.from),
    recipientProfile: input.to.trim(),
    text: input.text,
    createdAt: new Date().toISOString(),
    metadata: input.metadata
  };

  mockDirectMessages.push(created);
  persistOrderStore();
  return created;
}

export function registerPushToken(input: { profileName: string; pushToken: string }) {
  const normalizedProfileName = normalizeProfileName(input.profileName);
  const trimmedPushToken = input.pushToken.trim();
  const existing = mockPushTokenRegistrations.find(
    (item) =>
      normalizeProfileName(item.profileName) === normalizedProfileName &&
      item.pushToken === trimmedPushToken
  );

  if (existing) {
    existing.updatedAt = new Date().toISOString();
    return existing;
  }

  const created: PushTokenRegistration = {
    profileName: input.profileName.trim(),
    pushToken: trimmedPushToken,
    updatedAt: new Date().toISOString()
  };

  mockPushTokenRegistrations.push(created);
  return created;
}

export function listPushTokensForProfile(profileName: string) {
  const normalizedProfileName = normalizeProfileName(profileName);
  return mockPushTokenRegistrations
    .filter((item) => normalizeProfileName(item.profileName) === normalizedProfileName)
    .map((item) => item.pushToken);
}

export function getUserProfile(uid: string) {
  return mockUserProfiles.find((item) => item.uid === uid);
}

function syncBidReadinessFromUserProfile(profile: UserProfileRecord) {
  if (!profile.bidReadinessReady && !profile.bidPaymentMethodToken && !profile.bidDefaultShippingMethodId) {
    return;
  }

  mockBidReadinessByUserId[profile.uid] = {
    ready: Boolean(profile.bidReadinessReady),
    status: profile.bidReadinessStatus ?? (profile.bidReadinessReady ? "ready" : "not_ready"),
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth,
    line1: profile.addressLine1,
    city: profile.city,
    postalCode: profile.postalCode,
    countryCode: profile.country,
    phone: profile.phone,
    defaultShippingAddressId: `addr_${profile.uid}`,
    defaultShippingMethodId: profile.bidDefaultShippingMethodId,
    defaultPaymentMethodId: profile.bidPaymentMethodToken,
    termsAcceptedAt: profile.bidTermsAcceptedAt,
    shippingAddressSummary:
      profile.bidPickupPointLabel?.trim() || `${profile.addressLine1}, ${profile.city}`,
    shippingMethodLabel: profile.bidShippingProvider
      ? `${profile.bidShippingProvider}${profile.bidShippingPrice ? ` • ${profile.bidShippingPrice.toFixed(2)} EUR` : ""}`
      : profile.bidDefaultShippingMethodId,
    cardSummary: profile.bidPaymentMethodToken,
    shippingProvider: profile.bidShippingProvider,
    pickupPointId: profile.bidPickupPointId,
    pickupPointLabel: profile.bidPickupPointLabel,
    shippingPrice: profile.bidShippingPrice
  };
}

export function saveUserProfile(input: UserProfileRecord) {
  const sanitized = sanitizeUserProfile({
    ...input,
    username: input.username.trim(),
    updatedAt: input.updatedAt || new Date().toISOString()
  });
  syncBidReadinessFromUserProfile(sanitized);
  const existing = mockUserProfiles.find((item) => item.uid === input.uid);
  if (existing) {
    Object.assign(existing, sanitized);
    persistOrderStore();
    return existing;
  }

  mockUserProfiles.push(sanitized);
  persistOrderStore();
  return sanitized;
}

export function deleteUserProfile(uid: string) {
  const index = mockUserProfiles.findIndex((item) => item.uid === uid);
  if (index === -1) {
    return undefined;
  }

  const [removed] = mockUserProfiles.splice(index, 1);
  delete mockBidReadinessByUserId[uid];
  persistOrderStore();
  return removed;
}

export function reserveUsernameForProfile(input: { uid: string; username: string; previousUsername?: string }) {
  const normalizedUsername = input.username.trim().toLowerCase();
  const conflicting = mockUserProfiles.find(
    (item) => item.uid !== input.uid && item.username.trim().toLowerCase() === normalizedUsername
  );

  if (conflicting) {
    throw new Error("Username already exists.");
  }

  return input.username.trim();
}

export function getBuyerBidReadiness(userId: string) {
  return (
    mockBidReadinessByUserId[userId] ?? {
      ready: false,
      status: "not_ready"
    }
  );
}

export function saveBuyerBidReadiness(input: {
  userId: string;
  address: {
    fullName: string;
    dateOfBirth: string;
    line1: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone?: string;
  };
  defaultShippingMethodId: string;
  paymentMethodToken: string;
  acceptsInstantLotCharges: boolean;
  acceptsGroupedShippingCharges: boolean;
  shippingProvider?: "packeta" | "balikovna";
  pickupPointId?: string;
  pickupPointLabel?: string;
  shippingPrice?: number;
}) {
  const readiness: BuyerBidReadiness = {
    ready: input.acceptsInstantLotCharges && input.acceptsGroupedShippingCharges,
    status:
      input.acceptsInstantLotCharges && input.acceptsGroupedShippingCharges ? "ready" : "not_ready",
    fullName: input.address.fullName,
    dateOfBirth: input.address.dateOfBirth,
    line1: input.address.line1,
    city: input.address.city,
    postalCode: input.address.postalCode,
    countryCode: input.address.countryCode,
    phone: input.address.phone,
    defaultShippingAddressId: `addr_${input.userId}`,
    defaultShippingMethodId: input.defaultShippingMethodId,
    defaultPaymentMethodId: input.paymentMethodToken,
    termsAcceptedAt: new Date().toISOString(),
    shippingAddressSummary:
      input.pickupPointLabel?.trim() || `${input.address.line1}, ${input.address.city}`,
    shippingMethodLabel: input.shippingProvider
      ? `${input.shippingProvider}${input.shippingPrice ? ` • ${input.shippingPrice.toFixed(2)} EUR` : ""}`
      : input.defaultShippingMethodId,
    cardSummary: input.paymentMethodToken,
    shippingProvider: input.shippingProvider,
    pickupPointId: input.pickupPointId,
    pickupPointLabel: input.pickupPointLabel,
    shippingPrice: input.shippingPrice
  };

  mockBidReadinessByUserId[input.userId] = readiness;
  persistOrderStore();
  return readiness;
}

export function settleMockAuctionLot(input: { showId: string; userId?: string; buyerName?: string }) {
  const show = mockShows.find((item) => item.id === input.showId);
  const auction = mockAuctionsByShowId[input.showId];

  if (!show || !auction) {
    return undefined;
  }

  if (auction.status !== "ended") {
    return null;
  }

  if (!auction.highestBidderId || !auction.highestBidderName) {
    return null;
  }

  const activeItem = mockShowItemsByShowId[input.showId]?.find((item) => item.id === auction.showItemId);
  if (!activeItem) {
    return null;
  }

  const winnerUserId = auction.highestBidderId;
  const winnerName = auction.highestBidderName;
  const shipmentGroupId = `ship_group_${winnerUserId}_${input.showId}`;
  const existingShipmentGroup = mockShipmentGroups.find((group) => group.id === shipmentGroupId);
  const readiness = getBuyerBidReadiness(winnerUserId);
  const lotAmount = Number(auction.currentPrice.toFixed(2));
  const placedAt = new Date().toISOString();

  if (existingShipmentGroup) {
    existingShipmentGroup.lotCount += 1;
    existingShipmentGroup.itemTitles.push(activeItem.title);
    existingShipmentGroup.itemAmounts.push(lotAmount);
    existingShipmentGroup.totalAmount = Number((existingShipmentGroup.totalAmount + lotAmount).toFixed(2));
    existingShipmentGroup.placedAt = placedAt;
  } else {
    mockShipmentGroups.unshift({
      id: shipmentGroupId,
      buyerId: winnerUserId,
      sellerId: show.sellerId,
      sellerName: show.sellerName,
      showId: show.id,
      showTitle: show.title,
      shippingStatus: "open",
      lotCount: 1,
      buyerName: winnerName,
      itemTitles: [activeItem.title],
      itemAmounts: [lotAmount],
      totalAmount: lotAmount,
      shippingAmount: readiness.shippingPrice ?? 0,
      shippingMethodLabel: readiness.shippingMethodLabel,
      pickupPointId: readiness.pickupPointId,
      pickupPointLabel: readiness.pickupPointLabel,
      currency: activeItem.currency ?? "EUR",
      paymentStatus: "pending_capture",
      shipmentStatus: "grouped_open",
      sellerPayoutStatus: "pending_payment",
      deliveryProvider: readiness.shippingProvider,
      placedAt
    });
  }

  const shipmentGroup = mockShipmentGroups.find((group) => group.id === shipmentGroupId)!;
  const orderId = `ord_${shipmentGroupId}`;
  const grandTotal = Number((shipmentGroup.totalAmount + shipmentGroup.shippingAmount).toFixed(2));

  const orderSummary: OrderSummary = {
    id: orderId,
    buyerName: winnerName,
    sellerName: show.sellerName,
    status: statusForShipmentGroup(shipmentGroup),
    totalAmount: grandTotal,
    currency: shipmentGroup.currency,
    placedAt,
    showId: show.id,
    showTitle: show.title,
    buyerId: winnerUserId,
    sellerId: show.sellerId,
    orderType: "won",
    itemTitles: [...shipmentGroup.itemTitles],
    shippingAmount: shipmentGroup.shippingAmount,
    shippingMethodLabel: shipmentGroup.shippingMethodLabel,
    pickupPointId: shipmentGroup.pickupPointId,
    pickupPointLabel: shipmentGroup.pickupPointLabel,
    trackingNumber: shipmentGroup.trackingNumber,
    deliveryProvider: shipmentGroup.deliveryProvider,
    trackingStatus: shipmentGroup.trackingStatus,
    trackingLastEvent: shipmentGroup.trackingLastEvent,
    trackingLastEventAt: shipmentGroup.trackingLastEventAt,
    paymentStatus: shipmentGroup.paymentStatus,
    shipmentStatus: shipmentGroup.shipmentStatus,
    sellerPayoutStatus: shipmentGroup.sellerPayoutStatus,
    shippingInstruction: shippingInstructionForGroup(shipmentGroup)
  };

  const orderDetail: OrderDetail = {
    ...orderSummary,
    showTitle: show.title,
    lineItems: shipmentGroup.itemTitles.map((title, index) => ({
      title,
      pricingMode: "auction",
      amount: shipmentGroup.itemAmounts[index] ?? (index === shipmentGroup.itemTitles.length - 1 ? lotAmount : 0)
    })),
    paymentStatus: shipmentGroup.paymentStatus,
    shipmentStatus: shipmentGroup.shipmentStatus
  };

  if (shipmentGroup.shippingAmount > 0) {
    orderDetail.lineItems.push({
      title: "Shipping",
      pricingMode: "buy_now",
      amount: shipmentGroup.shippingAmount
    });
  }

  const existingOrderIndex = mockOrders.findIndex((order) => order.id === orderId);
  if (existingOrderIndex >= 0) {
    mockOrders[existingOrderIndex] = orderSummary;
  } else {
    mockOrders.unshift(orderSummary);
  }
  mockOrderDetails[orderId] = orderDetail;
  syncShipmentGroupToOrders(shipmentGroup);
  persistOrderStore();
  mockRecentWinnerByShowId[input.showId] = {
    itemId: activeItem.id,
    itemTitle: activeItem.title,
    winnerName: winnerName,
    amount: lotAmount,
    settledAt: placedAt
  };
  activeItem.lotStatus = "sold";
  clearMaxBidsForItem(input.showId, auction.showItemId);
  mockShowItemsByShowId[input.showId] = (mockShowItemsByShowId[input.showId] ?? [])
    .filter((item) => item.id !== auction.showItemId)
    .map((item, index) => ({
      ...item,
      queuePosition: index + 1
    }));
  delete mockAuctionsByShowId[input.showId];

  const settlement: AuctionSettlementResult = {
    shipmentGroupId,
    shippingStatus: shipmentGroup.shippingStatus,
    chargedAmount: lotAmount,
    currency: shipmentGroup.currency,
    order: {
      ...orderSummary,
      shipmentGroupLabel: `${shipmentGroup.showTitle} · ${shipmentGroup.lotCount} lots`
    }
  };
  mockLastAuctionSettlementByShowId[input.showId] = settlement;
  return settlement;
}

export function listBuyerOrders(input: { userId?: string; buyerName?: string; sellerName?: string } = {}) {
  const normalizedBuyerName = input.buyerName?.trim().toLowerCase();
  const hasBuyerFilter = Boolean(input.userId || normalizedBuyerName);
  const buyerMatches = (order: Pick<OrderSummary, "buyerId" | "buyerName">) => {
    if (!hasBuyerFilter) {
      return false;
    }

    if (input.userId && order.buyerId === input.userId) {
      return true;
    }

    return Boolean(normalizedBuyerName && order.buyerName.trim().toLowerCase() === normalizedBuyerName);
  };
  const shipmentGroupToOrder = (group: ShipmentGroupSummary, orderType: "won" | "sold"): OrderSummary => ({
    id: `${orderType === "sold" ? "sold" : "ord"}_${group.id}`,
    buyerName: group.buyerName,
    sellerName: group.sellerName,
    status: statusForShipmentGroup(group),
    totalAmount: Number((group.totalAmount + group.shippingAmount).toFixed(2)),
    currency: group.currency,
    placedAt: group.placedAt,
    showId: group.showId,
    showTitle: group.showTitle,
    buyerId: group.buyerId,
    sellerId: group.sellerId,
    orderType,
    itemTitles: [...group.itemTitles],
    shippingAmount: group.shippingAmount,
    shippingMethodLabel: group.shippingMethodLabel,
    pickupPointId: group.pickupPointId,
    pickupPointLabel: group.pickupPointLabel,
    trackingNumber: group.trackingNumber,
    deliveryProvider: group.deliveryProvider,
    trackingStatus: group.trackingStatus,
    trackingLastEvent: group.trackingLastEvent,
    trackingLastEventAt: group.trackingLastEventAt,
    paymentStatus: group.paymentStatus,
    shipmentStatus: group.shipmentStatus,
    sellerPayoutStatus: group.sellerPayoutStatus,
    shippingInstruction: shippingInstructionForGroup(group)
  });

  const wonOrders = mockOrders.filter((order) => {
    if (order.paymentStatus === "pending_capture") {
      return false;
    }

    if (hasBuyerFilter && !buyerMatches(order)) {
      return false;
    }

    if (!hasBuyerFilter && input.sellerName && order.sellerName !== input.sellerName) {
      return false;
    }

    return true;
  });

  const wonShipmentOrders = hasBuyerFilter
    ? mockShipmentGroups
        .filter((group) => group.paymentStatus !== "pending_capture" && buyerMatches(group))
        .map((group) => shipmentGroupToOrder(group, "won"))
    : [];

  const soldOrders = mockShipmentGroups
    .filter((group) => {
      if (group.paymentStatus === "pending_capture") {
        return false;
      }

      if (input.sellerName) {
        return group.sellerName === input.sellerName;
      }

      if (hasBuyerFilter) {
        return buyerMatches(group);
      }

      return true;
    })
    .map<OrderSummary>((group) => shipmentGroupToOrder(group, "sold"));

  const dedupedOrders = new Map<string, OrderSummary>();
  [...wonOrders, ...wonShipmentOrders, ...soldOrders].forEach((order) => {
    dedupedOrders.set(order.id, order);
  });

  return [...dedupedOrders.values()].sort(
    (left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime()
  );
}

export function getOrderDetail(orderId: string) {
  return mockOrderDetails[orderId];
}

export function saveOrderTracking(input: {
  orderId: string;
  provider: "packeta" | "balikovna" | "manual";
  trackingNumber: string;
}) {
  const shipmentGroup = findShipmentGroupByOrderId(input.orderId);
  if (!shipmentGroup) {
    return undefined;
  }

  shipmentGroup.trackingNumber = input.trackingNumber.trim();
  shipmentGroup.deliveryProvider = input.provider;
  shipmentGroup.shipmentStatus = "tracking_added";
  shipmentGroup.trackingStatus = "tracking_added";
  shipmentGroup.trackingLastEvent =
    shipmentGroup.paymentStatus === "captured"
      ? "Tracking number was added. Waiting for buyer delivery confirmation."
      : "Tracking number was added";
  shipmentGroup.trackingLastEventAt = new Date().toISOString();
  syncShipmentGroupToOrders(shipmentGroup);
  persistOrderStore();

  return shipmentGroup;
}

export function getOrderTracking(orderId: string) {
  const shipmentGroup = findShipmentGroupByOrderId(orderId);
  if (!shipmentGroup || !shipmentGroup.trackingNumber) {
    return undefined;
  }

  return {
    provider: (shipmentGroup.deliveryProvider as "packeta" | "balikovna" | "manual" | undefined) ?? "manual",
    trackingNumber: shipmentGroup.trackingNumber,
    status: shipmentGroup.trackingStatus ?? "tracking_added",
    lastEvent: shipmentGroup.trackingLastEvent,
    lastEventAt: shipmentGroup.trackingLastEventAt,
    updatedAt: shipmentGroup.trackingLastEventAt ?? shipmentGroup.placedAt,
    source: "manual" as const
  };
}

export function applyOrderTrackingSnapshot(orderId: string, snapshot: ShipmentTrackingSnapshot) {
  const shipmentGroup = findShipmentGroupByOrderId(orderId);
  if (!shipmentGroup) {
    return undefined;
  }

  shipmentGroup.deliveryProvider = snapshot.provider;
  shipmentGroup.trackingNumber = snapshot.trackingNumber;
  shipmentGroup.shipmentStatus = "tracking_added";
  shipmentGroup.trackingStatus = snapshot.status;
  shipmentGroup.trackingLastEvent = snapshot.lastEvent;
  shipmentGroup.trackingLastEventAt = snapshot.lastEventAt ?? snapshot.updatedAt;
  syncShipmentGroupToOrders(shipmentGroup);
  persistOrderStore();

  return shipmentGroup;
}

export function confirmOrderDelivery(orderId: string) {
  const shipmentGroup = findShipmentGroupByOrderId(orderId);
  if (!shipmentGroup) {
    return undefined;
  }

  shipmentGroup.shippingStatus = "shipping_paid";
  shipmentGroup.paymentStatus = "released_to_seller";
  shipmentGroup.shipmentStatus = "delivered_confirmed";
  shipmentGroup.sellerPayoutStatus = "released";
  shipmentGroup.trackingStatus = "delivered_confirmed";
  shipmentGroup.trackingLastEvent = "Buyer confirmed delivery. Seller payout released.";
  shipmentGroup.trackingLastEventAt = new Date().toISOString();
  syncShipmentGroupToOrders(shipmentGroup);
  persistOrderStore();

  return shipmentGroup;
}
