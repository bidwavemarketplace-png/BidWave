"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockOrders = exports.mockShows = exports.mockSellerApplications = void 0;
exports.listSellerApplications = listSellerApplications;
exports.createSellerApplication = createSellerApplication;
exports.getSellerDashboardSummary = getSellerDashboardSummary;
exports.listSellerShows = listSellerShows;
exports.createShow = createShow;
exports.listSellerOrders = listSellerOrders;
exports.getShowDetail = getShowDetail;
exports.getAuctionByShowId = getAuctionByShowId;
exports.placeMockBid = placeMockBid;
exports.listBuyerOrders = listBuyerOrders;
exports.getOrderDetail = getOrderDetail;
const now = "2026-04-01T12:00:00.000Z";
exports.mockSellerApplications = [
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
exports.mockShows = [
    {
        id: "show_live_1",
        title: "Tonight's Pokemon Break",
        sellerId: "usr_seller_1",
        sellerName: "CardCellar CZ",
        status: "live",
        scheduledFor: "2026-04-01T18:00:00.000Z"
    },
    {
        id: "show_sched_1",
        title: "Sunday Slabs",
        sellerId: "usr_seller_1",
        sellerName: "CardCellar CZ",
        status: "scheduled",
        scheduledFor: "2026-04-05T17:00:00.000Z"
    }
];
const mockShowItemsByShowId = {
    show_live_1: [
        {
            id: "item_1",
            title: "Charizard ex PSA 10",
            category: "Graded cards",
            pricingMode: "auction",
            currency: "EUR"
        },
        {
            id: "item_2",
            title: "151 Booster Bundle",
            category: "Sealed product",
            pricingMode: "buy_now",
            buyNowPrice: 54,
            currency: "EUR"
        }
    ],
    show_sched_1: [
        {
            id: "item_3",
            title: "Blastoise ex PSA 9",
            category: "Graded cards",
            pricingMode: "auction",
            currency: "EUR"
        }
    ]
};
const mockShowDescriptions = {
    show_live_1: "Fast auctions, sealed drops, and a collector-first stream built for Czech and Slovak buyers.",
    show_sched_1: "Sunday evening slabs with low starts, clean condition notes, and tracked shipping."
};
const mockAuctionsByShowId = {
    show_live_1: {
        id: "auc_live_1",
        showId: "show_live_1",
        showItemId: "item_1",
        status: "live",
        startPrice: 40,
        currentPrice: 57.5,
        minimumIncrement: 2.5,
        endsAt: "2026-04-01T18:45:00.000Z",
        highestBidderId: "usr_bidder_1",
        highestBidderName: "Marek V.",
        bidCount: 8
    }
};
exports.mockOrders = [
    {
        id: "ord_1",
        buyerName: "Marek V.",
        sellerName: "CardCellar CZ",
        status: "paid",
        totalAmount: 82.5,
        currency: "EUR",
        placedAt: "2026-03-28T19:22:00.000Z"
    },
    {
        id: "ord_2",
        buyerName: "Zuzana K.",
        sellerName: "CardCellar CZ",
        status: "fulfillment_pending",
        totalAmount: 149,
        currency: "EUR",
        placedAt: "2026-03-30T20:01:00.000Z"
    }
];
const mockOrderDetails = {
    ord_1: {
        id: "ord_1",
        buyerName: "Marek V.",
        sellerName: "CardCellar CZ",
        status: "paid",
        totalAmount: 82.5,
        currency: "EUR",
        placedAt: "2026-03-28T19:22:00.000Z",
        showTitle: "Tonight's Pokemon Break",
        lineItems: [
            {
                title: "151 Booster Bundle",
                pricingMode: "buy_now",
                amount: 54
            },
            {
                title: "Shipping",
                pricingMode: "buy_now",
                amount: 6.5
            }
        ],
        paymentStatus: "captured",
        shipmentStatus: "label_created"
    },
    ord_2: {
        id: "ord_2",
        buyerName: "Zuzana K.",
        sellerName: "CardCellar CZ",
        status: "fulfillment_pending",
        totalAmount: 149,
        currency: "EUR",
        placedAt: "2026-03-30T20:01:00.000Z",
        showTitle: "Sunday Slabs",
        lineItems: [
            {
                title: "Blastoise ex PSA 9",
                pricingMode: "auction",
                amount: 149
            }
        ],
        paymentStatus: "captured",
        shipmentStatus: "preparing"
    }
};
function listSellerApplications() {
    return exports.mockSellerApplications;
}
function createSellerApplication(input) {
    const application = {
        id: `sel_app_${exports.mockSellerApplications.length + 1}`,
        status: "pending_review",
        payoutHoldDays: 7,
        createdAt: new Date().toISOString(),
        ...input
    };
    exports.mockSellerApplications.push(application);
    return application;
}
function getSellerDashboardSummary(sellerId) {
    const application = exports.mockSellerApplications.find((item) => item.userId === sellerId) ??
        exports.mockSellerApplications[0];
    const sellerShows = exports.mockShows.filter((show) => show.sellerId === application.userId);
    const sellerOrders = exports.mockOrders.filter((order) => order.sellerName === application.storeName);
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
function listSellerShows(sellerId) {
    return exports.mockShows.filter((show) => show.sellerId === sellerId);
}
function createShow(input) {
    const show = {
        id: `show_${exports.mockShows.length + 1}`,
        status: "scheduled",
        ...input
    };
    exports.mockShows.push(show);
    return show;
}
function listSellerOrders(sellerName) {
    return exports.mockOrders.filter((order) => order.sellerName === sellerName);
}
function getShowDetail(showId) {
    const show = exports.mockShows.find((item) => item.id === showId);
    if (!show) {
        return undefined;
    }
    return {
        ...show,
        description: mockShowDescriptions[showId] ?? "Show detail coming soon.",
        viewers: show.status === "live" ? 184 : 42,
        coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
        items: mockShowItemsByShowId[showId] ?? [],
        streamRoomId: `room_${showId}`
    };
}
function getAuctionByShowId(showId) {
    return mockAuctionsByShowId[showId];
}
function placeMockBid(showId, amount) {
    const auction = mockAuctionsByShowId[showId];
    if (!auction) {
        return undefined;
    }
    const minimumValidAmount = auction.currentPrice + auction.minimumIncrement;
    const accepted = amount >= minimumValidAmount;
    if (accepted) {
        auction.currentPrice = amount;
        auction.highestBidderId = "usr_demo_bidder";
        auction.highestBidderName = "You";
        auction.bidCount += 1;
    }
    return {
        accepted,
        minimumValidAmount,
        auction
    };
}
function listBuyerOrders() {
    return exports.mockOrders;
}
function getOrderDetail(orderId) {
    return mockOrderDetails[orderId];
}
