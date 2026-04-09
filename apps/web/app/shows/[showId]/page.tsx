import { LiveRoomShell } from "../../../components/live-room-shell";
import { ShowDetailHero } from "../../../components/show-detail-hero";

const showData: Record<
  string,
  {
    title: string;
    sellerName: string;
    description: string;
    status: string;
    viewers: number;
    coverImage: string;
    items: Array<{ id: string; title: string; pricingMode: string; price?: string }>;
    auction?: {
      title: string;
      currentPrice: number;
      minimumIncrement: number;
      highestBidderName?: string;
      bidCount: number;
    };
  }
> = {
  show_live_1: {
    title: "Tonight's Pokemon Break",
    sellerName: "CardCellar CZ",
    description:
      "Fast auctions, sealed drops, and a collector-first live room designed around clean checkout.",
    status: "Live now",
    viewers: 184,
    coverImage:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80",
    items: [
      { id: "item_1", title: "Charizard ex PSA 10", pricingMode: "auction" },
      { id: "item_2", title: "151 Booster Bundle", pricingMode: "buy_now", price: "54 EUR" }
    ],
    auction: {
      title: "Charizard ex PSA 10",
      currentPrice: 57.5,
      minimumIncrement: 2.5,
      highestBidderName: "Marek V.",
      bidCount: 8
    }
  },
  show_sched_1: {
    title: "Sunday Slabs",
    sellerName: "CardCellar CZ",
    description:
      "A scheduled slab-focused show with low starts, condition notes, and cleaner pacing for collectors.",
    status: "Scheduled",
    viewers: 42,
    coverImage:
      "https://images.unsplash.com/photo-1560253023-3ec5d502959f?auto=format&fit=crop&w=1200&q=80",
    items: [{ id: "item_3", title: "Blastoise ex PSA 9", pricingMode: "auction" }]
  }
};

export default async function ShowDetailPage({
  params
}: {
  params: Promise<{ showId: string }>;
}) {
  const { showId } = await params;
  const show = showData[showId] ?? showData.show_live_1;

  return (
    <main className="page-shell">
      <ShowDetailHero
        title={show.title}
        sellerName={show.sellerName}
        description={show.description}
        status={show.status}
        viewers={show.viewers}
        coverImage={show.coverImage}
      />

      {show.auction ? (
        <section className="section">
          <LiveRoomShell
            title={show.auction.title}
            currentPrice={show.auction.currentPrice}
            minimumIncrement={show.auction.minimumIncrement}
            highestBidderName={show.auction.highestBidderName}
            bidCount={show.auction.bidCount}
          />
        </section>
      ) : null}

      <section className="section">
        <div className="section-copy">
          <p className="eyebrow">Run sheet</p>
          <h2>Items queued for the stream</h2>
        </div>

        <div className="feature-grid">
          {show.items.map((item) => (
            <article className="feature-card" key={item.id}>
              <p className="feature-kicker">{item.pricingMode}</p>
              <div className="feature-copy">
                <h3>{item.title}</h3>
                <p>{item.price ?? "Price set by live bidding."}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
