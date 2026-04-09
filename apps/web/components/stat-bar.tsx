const stats = [
  {
    label: "Phase",
    value: "MVP",
    hint: "Curated pilot, single vertical"
  },
  {
    label: "Core loop",
    value: "Live -> Bid -> Pay",
    hint: "Everything optimized for conversion"
  },
  {
    label: "Trust model",
    value: "KYC + holds",
    hint: "Protect buyers and control payout risk"
  },
  {
    label: "Infra",
    value: "Web + API",
    hint: "Realtime auctions with provider-backed video"
  }
];

export function StatBar() {
  return (
    <section className="stat-bar">
      {stats.map((stat) => (
        <article className="stat-card" key={stat.label}>
          <p className="stat-label">{stat.label}</p>
          <div className="stat-value">{stat.value}</div>
          <p className="stat-hint">{stat.hint}</p>
        </article>
      ))}
    </section>
  );
}
