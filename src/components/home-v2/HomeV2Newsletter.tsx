"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

export function HomeV2Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      const data: { message?: string } = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("ok");
        setMessage(data.message ?? "You are on the list. Watch for Friday.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.message ?? "That did not go through. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("That did not go through. Try again.");
    }
  }

  return (
    <section className="newsletter">
      <div className="container">
        <p className="newsletter-lead">
          <strong>Not ready to run an evaluation?</strong> Get the Friday post. A
          short word on sharper preaching, free, no account required.
        </p>
        <form className="newsletter-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="home-v2-newsletter-email">Email</label>
          <div className="newsletter-row">
            <input
              id="home-v2-newsletter-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="you@church.org"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" className="btn" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Get the Friday post"}
            </button>
          </div>
        </form>
        <p className="newsletter-message" role="status" aria-live="polite">
          {message}
        </p>
      </div>
    </section>
  );
}
