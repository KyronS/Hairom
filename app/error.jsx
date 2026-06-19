"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 20,
          padding: "0 24px",
          textAlign: "center",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#fff",
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 300, margin: 0 }}>
          An unexpected error occurred.
        </h1>
        <div style={{ display: "flex", gap: 12 }}>
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
            href="/"
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
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
