import { FeatureGrid } from "../components/feature-grid";
import { Hero } from "../components/hero";
import { LiveShowCard } from "../components/live-show-card";
import { StatBar } from "../components/stat-bar";

const sampleShows = [
  {
    title: "Tonight's Pokemon Break",
    seller: "CardCellar CZ",
    status: "Live now",
    viewers: 184,
    highlight: "18 booster bundles queued"
  },
  {
    title: "Vintage Sneakers Drop",
    seller: "Archive Heat",
    status: "Starts in 43 min",
    viewers: 72,
    highlight: "12 pairs with buy-now offers"
  },
  {
    title: "Sunday Graded Cards",
    seller: "Slab Room SK",
    status: "Tomorrow 19:00",
    viewers: 0,
    highlight: "PSA lots and rapid-fire auctions"
  }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <Hero />
      <StatBar />

      <section className="section">
        <div className="section-copy">
          <p className="eyebrow">Live inventory</p>
          <h2>Shows built for fast auctions and trusted checkout</h2>
          <p>
            Start with curated sellers, real-time bidding, and buyer protection.
            Scale supply only after the transaction engine is stable.
          </p>
        </div>

        <div className="show-grid">
          {sampleShows.map((show) => (
            <LiveShowCard key={show.title} {...show} />
          ))}
        </div>

        <div className="section-actions">
          <a className="button primary" href="/shows">
            Explore buyer feed
          </a>
        </div>
      </section>

      <section className="section">
        <div className="section-copy">
          <p className="eyebrow">MVP shape</p>
          <h2>The first release should be narrow and operationally strong</h2>
        </div>
        <FeatureGrid />
      </section>
    </main>
  );
}
