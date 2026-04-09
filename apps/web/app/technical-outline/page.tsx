const blocks = [
  {
    title: "Apps",
    body: "Next.js web app for buyers, sellers, and internal operators. API service handles marketplace state and provider integration."
  },
  {
    title: "Realtime",
    body: "Auction truth stays on the backend. Websocket events broadcast bid updates, room presence, and show state."
  },
  {
    title: "Persistence",
    body: "Postgres stores marketplace data, Redis coordinates low-latency auction updates, and object storage handles uploads."
  },
  {
    title: "Payments and video",
    body: "Stripe Connect is the best default for payouts, while LiveKit or Mux can power show streaming depending on control needs."
  }
];

export default function TechnicalOutlinePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Technical outline</p>
        <h1>Architecture built for a pilot that can scale.</h1>
        <p>
          The most important constraint is simple: bids, payments, and order
          outcomes must be server-authoritative.
        </p>
      </section>

      <section className="section">
        <div className="feature-grid">
          {blocks.map((block) => (
            <article className="feature-card" key={block.title}>
              <div className="feature-copy">
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
