import { sellerOrders, sellerShows, sellerSummary } from "../../../lib/mock-data";

export default function SellerDashboardPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Seller dashboard</p>
        <h1>{sellerSummary.storeName}</h1>
        <p>
          Seller status: <strong>{sellerSummary.status}</strong>. Pilot sellers get{" "}
          {sellerSummary.payoutHoldDays}-day payout holds while trust signals build.
        </p>
      </section>

      <section className="stat-bar">
        <article className="stat-card">
          <p className="stat-label">Upcoming shows</p>
          <div className="stat-value">{sellerSummary.upcomingShows}</div>
          <p className="stat-hint">Scheduled inventory ready to promote</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Live now</p>
          <div className="stat-value">{sellerSummary.liveShows}</div>
          <p className="stat-hint">Current active rooms</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Orders</p>
          <div className="stat-value">{sellerSummary.totalOrders}</div>
          <p className="stat-hint">Recent paid and pending fulfillment</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">GMV</p>
          <div className="stat-value">{sellerSummary.grossMerchandiseValue} EUR</div>
          <p className="stat-hint">Mock pilot revenue snapshot</p>
        </article>
      </section>

      <section className="section">
        <div className="section-copy inline-row">
          <div>
            <p className="eyebrow">Shows</p>
            <h2>Pipeline for the next streams</h2>
          </div>
          <a className="button primary" href="/shows/new">
            New show
          </a>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Scheduled</th>
              </tr>
            </thead>
            <tbody>
              {sellerShows.map((show) => (
                <tr key={show.id}>
                  <td>{show.title}</td>
                  <td>{show.status}</td>
                  <td>{show.scheduledFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <div className="section-copy">
          <p className="eyebrow">Orders</p>
          <h2>Recent transaction flow</h2>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Total</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {sellerOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.buyerName}</td>
                  <td>{order.status}</td>
                  <td>{order.totalAmount}</td>
                  <td>{order.placedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
