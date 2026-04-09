"use client";

import { FormEvent, useState } from "react";

const initialState = {
  storeName: "",
  legalName: "",
  countryCode: "CZ",
  categoryFocus: "Pokemon cards"
};

export function SellerApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState(initialState);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="stack-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Store name</span>
          <input
            value={values.storeName}
            onChange={(event) =>
              setValues((current) => ({ ...current, storeName: event.target.value }))
            }
            placeholder="CardCellar CZ"
            required
          />
        </label>

        <label className="field">
          <span>Legal entity</span>
          <input
            value={values.legalName}
            onChange={(event) =>
              setValues((current) => ({ ...current, legalName: event.target.value }))
            }
            placeholder="CardCellar s.r.o."
            required
          />
        </label>

        <label className="field">
          <span>Country</span>
          <select
            value={values.countryCode}
            onChange={(event) =>
              setValues((current) => ({ ...current, countryCode: event.target.value }))
            }
          >
            <option value="CZ">Czech Republic</option>
            <option value="SK">Slovakia</option>
          </select>
        </label>

        <label className="field">
          <span>Primary category</span>
          <input
            value={values.categoryFocus}
            onChange={(event) =>
              setValues((current) => ({ ...current, categoryFocus: event.target.value }))
            }
            placeholder="Pokemon cards"
            required
          />
        </label>
      </div>

      <button className="button primary" type="submit">
        Submit application
      </button>

      {submitted ? (
        <p className="success-note">
          Application captured. In the real flow this would create a pending seller
          review and start KYC collection.
        </p>
      ) : null}
    </form>
  );
}
