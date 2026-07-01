// Server Component — no "use client" directive
import { revalidatePath } from "next/cache";
import { findAndCancelBooking, getAllBookings, getAdminStats } from "@/lib/googleSheets";
import { BUSINESS_NAME } from "@/lib/config";
import { formatTime12h, formatDateLong } from "@/lib/bookingUtils";
import Header5 from "@/components/headers/Header5";

const adminNav = [{ href: "/", text: "Back to Site" }];

// ── Server Action: cancel a booking ──────────────────────────────────────────
async function cancelBooking(formData) {
  "use server";
  const id = formData.get("bookingId");
  if (!id) return;
  await findAndCancelBooking(id);
  revalidatePath("/admin");
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function AdminPage({ searchParams }) {
  const statusFilter = searchParams?.status ?? "confirmed";
  const showPast     = searchParams?.past === "1";

  const [bookings, { totalUpcoming, totalToday }] = await Promise.all([
    getAllBookings({ statusFilter, includePast: showPast }),
    getAdminStats(),
  ]);

  // ── Styles ──────────────────────────────────────────────────────────────────
  const th = {
    textAlign: "left",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    fontWeight: 400,
  };
  const td = {
    padding: "13px 16px",
    color: "rgba(255,255,255,0.55)",
    verticalAlign: "middle",
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  };

  return (
    <div className="theme-elegant">
      <div className="page bg-dark-1" id="top">
        <nav className="main-nav dark stick-fixed">
          <Header5 links={adminNav} logoHref="/" />
        </nav>

        <main id="main" style={{ minHeight: "100vh", paddingTop: 100 }}>
          <section className="light-content">
            <div className="container" style={{ paddingTop: 72, paddingBottom: 100 }}>

              {/* ── Page heading ── */}
              <div style={{ marginBottom: 48 }}>
                <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
                  {BUSINESS_NAME}
                </p>
                <h1 className="font-alt" style={{ fontSize: "2rem", fontWeight: 300, color: "#fff", marginBottom: 20 }}>
                  Admin Dashboard
                </h1>

                {/* Stats */}
                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                  {[
                    { label: "Today",    value: totalToday    },
                    { label: "Upcoming", value: totalUpcoming },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span style={{ fontSize: 28, fontWeight: 300, color: "#fff" }}>{value}</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginLeft: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Filter bar ── */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 32 }}>
                {[
                  { label: "Upcoming",  value: "confirmed" },
                  { label: "Cancelled", value: "cancelled" },
                  { label: "All",       value: "all"       },
                ].map(({ label, value }) => (
                  <a
                    key={value}
                    href={`/admin?status=${value}${showPast ? "&past=1" : ""}`}
                    style={{
                      padding: "8px 18px",
                      border: `1px solid ${statusFilter === value ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 2,
                      color: statusFilter === value ? "#fff" : "rgba(255,255,255,0.35)",
                      fontSize: 12,
                      letterSpacing: "0.06em",
                      textDecoration: "none",
                    }}
                  >
                    {label}
                  </a>
                ))}

                <a
                  href={`/admin?status=${statusFilter}${showPast ? "" : "&past=1"}`}
                  style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, marginLeft: 8, textDecoration: "none" }}
                >
                  {showPast ? "Hide past" : "Show past bookings"}
                </a>
              </div>

              {/* ── Table ── */}
              {!bookings?.length ? (
                <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>
                  No bookings found for this filter.
                </p>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Ref", "Client", "Email", "Phone", "Service", "House Call", "Date", "Time", "Total", "Status", "Booked", ""].map((col) => (
                          <th key={col} style={th}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => {
                        const isCancelled = b.status === "cancelled";
                        const dateShort   = formatDateLong(b.appointment_date)
                          .split(",").slice(0, 2).join(",");
                        const timeDisplay = formatTime12h(
                          b.appointment_time.substring(0, 5)
                        );
                        const bookedOn = new Date(b.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        });

                        return (
                          <tr key={b.id} style={{ opacity: isCancelled ? 0.45 : 1 }}>
                            <td style={{ ...td, fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                              {b.id.slice(-8).toUpperCase()}
                            </td>
                            <td style={{ ...td, color: "#fff", fontWeight: 500 }}>{b.client_name}</td>
                            <td style={td}>{b.client_email}</td>
                            <td style={td}>{b.client_phone ?? "—"}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{b.service_name}</td>
                            <td style={td}>
                              {b.house_call ? (
                                <span style={{
                                  padding: "2px 8px", borderRadius: 20, fontSize: 10,
                                  letterSpacing: "0.08em", textTransform: "uppercase",
                                  background: "rgba(120,170,255,0.1)",
                                  color: "#88b8ff",
                                  border: "1px solid rgba(120,170,255,0.25)",
                                }}>
                                  House Call
                                </span>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{dateShort}</td>
                            <td style={{ ...td, whiteSpace: "nowrap" }}>{timeDisplay}</td>
                            <td style={td}>${b.service_price + (b.house_call ? b.house_call_fee : 0)}</td>
                            <td style={td}>
                              <span style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 10,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                background: isCancelled ? "rgba(255,100,100,0.1)" : "rgba(100,210,100,0.1)",
                                color:      isCancelled ? "#ff8080"                : "#7ddb88",
                                border: `1px solid ${isCancelled ? "rgba(255,100,100,0.22)" : "rgba(100,210,100,0.22)"}`,
                              }}>
                                {b.status}
                              </span>
                            </td>
                            <td style={{ ...td, whiteSpace: "nowrap", fontSize: 12 }}>{bookedOn}</td>
                            <td style={td}>
                              {!isCancelled ? (
                                <form action={cancelBooking}>
                                  <input type="hidden" name="bookingId" value={b.id} />
                                  <button
                                    type="submit"
                                    style={{
                                      background: "none",
                                      border: "1px solid rgba(255,100,100,0.28)",
                                      color: "rgba(255,100,100,0.65)",
                                      borderRadius: 2,
                                      padding: "4px 12px",
                                      fontSize: 11,
                                      cursor: "pointer",
                                      letterSpacing: "0.04em",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 11 }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
