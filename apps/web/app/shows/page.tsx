import { sellerShows } from "../../lib/mock-data";

export default function ShowsPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Buyer discovery</p>
        <h1>Discover scheduled and live shows.</h1>
        <p>
          This page stands in for the first buyer feed: a curated stream lineup
          instead of an algorithm-heavy homepage.
        </p>
      </section>

      <section className="section">
        <div className="show-grid">
          {sellerShows.map((show) => (
            <article className="show-card" key={show.id}>
              <div className="show-header">
                <p className="pill">
                  <span className="dot" />
                  {show.status}
                </p>
                <span className="show-meta">{show.scheduledFor}</span>
              </div>
              <h3>{show.title}</h3>
              <p className="show-meta">Hosted by {show.sellerName}</p>
              <div className="show-footer">
                <p>Cards, fast starts, tracked shipping.</p>
                <a className="button" href={`/shows/${show.id}`}>
                  Enter room
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
