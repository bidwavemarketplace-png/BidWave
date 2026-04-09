export function Hero() {
  return (
    <section className="hero">
      <div className="hero-card">
        <p className="eyebrow">BidWave for CZ/SK</p>
        <h1>Live auctions for local collector communities.</h1>
        <p>
          A region-first marketplace for live selling, fast checkout, and
          trusted payouts. Built for curated inventory, not anonymous chaos.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#launch-plan">
            View launch shape
          </a>
          <a className="button" href="/spec">
            Product spec
          </a>
        </div>
      </div>

      <div className="hero-side">
        <div className="panel live">
          <p className="eyebrow">Pilot rule</p>
          <h3>Invite only sellers in one category</h3>
          <p>
            Start with cards and collectibles, keep operations tight, and build
            trust before expanding to fashion or vintage.
          </p>
        </div>

        <div className="panel" id="launch-plan">
          <p className="eyebrow">Launch checklist</p>
          <ul>
            <li>Seller verification and payout holds</li>
            <li>Server-authoritative auction engine</li>
            <li>Saved payment method before bidding</li>
            <li>Moderation tools for support and disputes</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
