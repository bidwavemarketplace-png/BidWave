const features = [
  {
    kicker: "Marketplace",
    title: "Seller dashboard with show scheduling",
    description:
      "Approved sellers can build shows, prepare lots, and launch with a clear operating flow."
  },
  {
    kicker: "Realtime",
    title: "Auctions controlled by the server",
    description:
      "Clients render fast feedback, but bid acceptance and anti-sniping live on the backend."
  },
  {
    kicker: "Payments",
    title: "Checkout and payout foundation",
    description:
      "Order, payment, and payout states are already modeled for a Stripe Connect style flow."
  },
  {
    kicker: "Operations",
    title: "Moderation and support from day one",
    description:
      "Risk flags, disputes, and payout holds are part of the first release rather than an afterthought."
  }
];

export function FeatureGrid() {
  return (
    <div className="feature-grid">
      {features.map((feature) => (
        <article className="feature-card" key={feature.title}>
          <p className="feature-kicker">{feature.kicker}</p>
          <div className="feature-copy">
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
