const orderData: Record<
  string,
  {
    id: string;
    showTitle: string;
    sellerName: string;
    status: string;
    paymentStatus: string;
    shipmentStatus: string;
    total: string;
    items: Array<{ title: string; amount: string; pricingMode: string }>;
  }
> = {
  ord_1: {
    id: "ord_1",
    showTitle: "Tonight's Pokemon Break",
    sellerName: "CardCellar CZ",
    status: "paid",
    paymentStatus: "captured",
    shipmentStatus: "label_created",
    total: "82.50 EUR",
    items: [
      { title: "151 Booster Bundle", amount: "54.00 EUR", pricingMode: "buy_now" },
      { title: "Shipping", amount: "6.50 EUR", pricingMode: "system" }
    ]
  },
  ord_2: {
    id: "ord_2",
    showTitle: "Sunday Slabs",
    sellerName: "CardCellar CZ",
    status: "fulfillment_pending",
    paymentStatus: "captured",
    shipmentStatus: "preparing",
    total: "149.00 EUR",
    items: [
      { title: "Blastoise ex PSA 9", amount: "149.00 EUR", pricingMode: "auction" }
    ]
  }
};

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = orderData[orderId] ?? orderData.ord_1;

  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Order detail</p>
        <h1>{order.id}</h1>
        <p>
          {order.showTitle} · {order.sellerName}
        </p>
      </section>

      <section className="stat-bar">
        <article className="stat-card">
          <p className="stat-label">Status</p>
          <div className="stat-value">{order.status}</div>
          <p className="stat-hint">Top-level order state</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Payment</p>
          <div className="stat-value">{order.paymentStatus}</div>
          <p className="stat-hint">Funds state</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Shipment</p>
          <div className="stat-value">{order.shipmentStatus}</div>
          <p className="stat-hint">Fulfillment progress</p>
        </article>
        <article className="stat-card">
          <p className="stat-label">Total</p>
          <div className="stat-value">{order.total}</div>
          <p className="stat-hint">Charged amount</p>
        </article>
      </section>

      <section className="section">
        <div className="section-copy">
          <p className="eyebrow">Line items</p>
          <h2>What the buyer actually paid for</h2>
        </div>
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Mode</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.title}>
                  <td>{item.title}</td>
                  <td>{item.pricingMode}</td>
                  <td>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
