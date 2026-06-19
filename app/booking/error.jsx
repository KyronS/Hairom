"use client";

export default function BookingError({ error, reset }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,100,100,0.6)",
          margin: 0,
        }}
      >
        Something went wrong
      </p>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 300,
          color: "#fff",
          margin: 0,
        }}
      >
        Unable to load the booking page.
      </h1>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          maxWidth: 400,
          lineHeight: 1.7,
          margin: 0,
        }}
      >
        {error?.message || "An unexpected error occurred. Please try again or contact us on WhatsApp."}
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 2,
            color: "#fff",
            fontSize: 12,
            letterSpacing: "0.06em",
            padding: "10px 24px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "18683755357"}`}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            letterSpacing: "0.06em",
            padding: "10px 24px",
            textDecoration: "none",
          }}
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
