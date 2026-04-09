"use client";

import { FormEvent, useState } from "react";

const initialState = {
  title: "",
  description: "",
  scheduledFor: "2026-04-05T19:00",
  category: "Pokemon cards"
};

export function CreateShowForm() {
  const [values, setValues] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="stack-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field-span">
          <span>Show title</span>
          <input
            value={values.title}
            onChange={(event) =>
              setValues((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Sunday Slabs"
            required
          />
        </label>

        <label className="field field-span">
          <span>Description</span>
          <textarea
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Fast slabs, low starts, buy-now singles, EU shipping."
            rows={5}
            required
          />
        </label>

        <label className="field">
          <span>Scheduled time</span>
          <input
            type="datetime-local"
            value={values.scheduledFor}
            onChange={(event) =>
              setValues((current) => ({ ...current, scheduledFor: event.target.value }))
            }
            required
          />
        </label>

        <label className="field">
          <span>Category</span>
          <input
            value={values.category}
            onChange={(event) =>
              setValues((current) => ({ ...current, category: event.target.value }))
            }
            required
          />
        </label>
      </div>

      <button className="button primary" type="submit">
        Create scheduled show
      </button>

      {submitted ? (
        <p className="success-note">
          Scheduled show prepared. In the real flow this would call `POST /shows`
          and reserve a stream room.
        </p>
      ) : null}
    </form>
  );
}
