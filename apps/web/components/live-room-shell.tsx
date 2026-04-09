"use client";

import { useState } from "react";

type LiveRoomShellProps = {
  title: string;
  currentPrice: number;
  minimumIncrement: number;
  highestBidderName?: string;
  bidCount: number;
};

export function LiveRoomShell(props: LiveRoomShellProps) {
  const [bidValue, setBidValue] = useState(
    String(props.currentPrice + props.minimumIncrement)
  );
  const [message, setMessage] = useState(
    `Next valid bid is ${props.currentPrice + props.minimumIncrement} EUR`
  );

  function handleBid() {
    const numericValue = Number(bidValue);
    const minimumAllowed = props.currentPrice + props.minimumIncrement;

    if (numericValue < minimumAllowed) {
      setMessage(`Bid too low. Minimum valid bid is ${minimumAllowed} EUR.`);
      return;
    }

    setMessage(
      `Mock bid accepted at ${numericValue} EUR. Next step is wiring this to POST /shows/:showId/auction/bids.`
    );
  }

  return (
    <section className="live-room-grid">
      <article className="panel stream-panel">
        <div className="stream-placeholder">
          <div className="stream-badge">Live stream slot</div>
          <p>{props.title}</p>
        </div>
      </article>

      <aside className="stack-card">
        <p className="eyebrow">Current auction</p>
        <h3>{props.title}</h3>
        <div className="auction-price">{props.currentPrice} EUR</div>
        <p className="show-meta">
          Leading bidder: {props.highestBidderName ?? "No bids yet"} · {props.bidCount} bids
        </p>

        <label className="field">
          <span>Your bid</span>
          <input
            value={bidValue}
            onChange={(event) => setBidValue(event.target.value)}
            inputMode="decimal"
          />
        </label>

        <button className="button primary" type="button" onClick={handleBid}>
          Place mock bid
        </button>
        <p className="show-meta">{message}</p>
      </aside>
    </section>
  );
}
