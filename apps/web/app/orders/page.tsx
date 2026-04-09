import { OrderList } from "../../components/order-list";
import { sellerOrders } from "../../lib/mock-data";

export default function OrdersPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Buyer orders</p>
        <h1>Track paid and pending deliveries.</h1>
        <p>
          The buyer side needs a simple, trustworthy order ledger before anything
          more social or gamified.
        </p>
      </section>

      <section className="section">
        <OrderList orders={sellerOrders} />
      </section>
    </main>
  );
}
