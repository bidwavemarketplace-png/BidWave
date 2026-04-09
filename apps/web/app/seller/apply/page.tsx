import { SellerApplicationForm } from "../../../components/seller-application-form";

export default function SellerApplyPage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Seller onboarding</p>
        <h1>Apply to sell on BidWave.</h1>
        <p>
          The pilot stays curated. Sellers apply first, pass review, then unlock
          show creation and payouts.
        </p>
      </section>

      <section className="section">
        <div className="section-copy">
          <h2>What we collect in MVP</h2>
          <p>
            Store identity, market, category focus, and enough business context to
            start review and later connect KYC.
          </p>
        </div>
        <SellerApplicationForm />
      </section>
    </main>
  );
}
