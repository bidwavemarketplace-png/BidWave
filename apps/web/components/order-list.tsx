type OrderListItem = {
  id: string;
  buyerName: string;
  status: string;
  totalAmount: string;
  placedAt: string;
};

export function OrderList({ orders }: { orders: OrderListItem[] }) {
  return (
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
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <a className="text-link" href={`/orders/${order.id}`}>
                  {order.id}
                </a>
              </td>
              <td>{order.buyerName}</td>
              <td>{order.status}</td>
              <td>{order.totalAmount}</td>
              <td>{order.placedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
