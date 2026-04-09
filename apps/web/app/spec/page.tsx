const sections = [
  {
    title: "Audience",
    body: "Curated sellers and collector buyers in one launch country, starting with cards and adjacent collectibles."
  },
  {
    title: "Core loop",
    body: "Browse live shows, join a stream, bid in realtime, pay fast, and track the order without leaving the platform."
  },
  {
    title: "Trust design",
    body: "Seller verification, payout holds, moderation tooling, and buyer support are part of MVP rather than post-launch cleanup."
  }
];

export default function SpecPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Product spec</p>
        <h1>BidWave MVP in one page.</h1>
        <p>
          This web summary mirrors the written blueprint in the repository docs
          and keeps the launch scope intentionally tight.
        </p>
      </section>

      <section className="section">
        <div className="feature-grid">
          {sections.map((section) => (
            <article className="feature-card" key={section.title}>
              <div className="feature-copy">
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
