import { CreateShowForm } from "../../../components/create-show-form";

export default function NewShowPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Show creation</p>
        <h1>Schedule the next live show.</h1>
        <p>
          This is the seller-side flow for preparing a stream before inventory and
          auctions are loaded in.
        </p>
      </section>

      <section className="section">
        <div className="section-copy">
          <h2>First release shape</h2>
          <p>
            One scheduled title, one stream slot, clear category focus, then items
            get attached as the seller builds the run sheet.
          </p>
        </div>
        <CreateShowForm />
      </section>
    </main>
  );
}
