// Server Component — no "use client" directive
import { revalidatePath } from "next/cache";
import {
  getBusinessHours,
  getBlockedDates,
  getAllBookings,
  saveSchedule,
  addBlockedDate,
  removeBlockedDate,
  getSettings,
  updateSetting,
} from "@/lib/googleSheets";
import { formatTime12h, formatDateLong } from "@/lib/bookingUtils";
import { BUSINESS_NAME } from "@/lib/config";
import Header5 from "@/components/headers/Header5";

const ownerNav = [{ href: "/", text: "Back to Site" }];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ── Server Action: save weekly schedule ──────────────────────────────────────
async function saveScheduleAction(formData) {
  "use server";
  const weekRows = DAY_NAMES.map((_, i) => ({
    day_of_week: i,
    is_open:     formData.get(`is_open_${i}`) === "1",
    open_time:   formData.get(`open_time_${i}`)  || null,
    close_time:  formData.get(`close_time_${i}`) || null,
  }));
  await saveSchedule(weekRows);
  revalidatePath("/owner");
}

// ── Server Action: add a blocked date ────────────────────────────────────────
async function addBlockedDateAction(formData) {
  "use server";
  const date   = formData.get("date");
  const reason = formData.get("reason")?.trim() || null;
  if (!date) return;
  try {
    await addBlockedDate(date, reason);
  } catch {
    // Duplicate — silently ignore (date already blocked)
  }
  revalidatePath("/owner");
}

// ── Server Action: remove a blocked date ─────────────────────────────────────
async function removeBlockedDateAction(formData) {
  "use server";
  const date = formData.get("date");
  if (!date) return;
  await removeBlockedDate(date);
  revalidatePath("/owner");
}

// ── Server Action: save house call settings ──────────────────────────────────
async function saveHouseCallSettingsAction(formData) {
  "use server";
  const enabled = formData.get("house_call_enabled") === "1";
  const price   = Number(formData.get("house_call_price") ?? 150) || 150;
  await Promise.all([
    updateSetting("house_call_enabled", enabled ? "TRUE" : "FALSE"),
    updateSetting("house_call_price",   String(price)),
  ]);
  revalidatePath("/owner");
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function OwnerPage() {
  const today          = new Date().toISOString().slice(0, 10);
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [businessHours, blockedDates, allUpcoming, settings] = await Promise.all([
    getBusinessHours(),
    getBlockedDates(),
    getAllBookings({ statusFilter: "confirmed", includePast: false }),
    getSettings(),
  ]);

  const houseCallEnabled = settings.house_call_enabled === "TRUE";
  const houseCallPrice   = Number(settings.house_call_price ?? 150) || 150;

  const upcomingBookings = allUpcoming.filter(
    b => b.appointment_date >= today && b.appointment_date <= sevenDaysLater
  );

  // Styles
  const label = {
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.3)",
    marginBottom: 6,
    display: "block",
  };
  const sectionHeading = {
    fontSize: "1.1rem",
    fontWeight: 300,
    color: "#fff",
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };
  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 2,
    color: "#fff",
    fontSize: 13,
    padding: "7px 10px",
    outline: "none",
  };
  const btnPrimary = {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 2,
    color: "#fff",
    fontSize: 12,
    letterSpacing: "0.06em",
    padding: "9px 20px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
  const btnDanger = {
    background: "none",
    border: "1px solid rgba(255,100,100,0.28)",
    borderRadius: 2,
    color: "rgba(255,100,100,0.65)",
    fontSize: 11,
    padding: "4px 12px",
    cursor: "pointer",
    letterSpacing: "0.04em",
    whiteSpace: "nowrap",
  };
  const th = {
    textAlign: "left",
    padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    fontWeight: 400,
    whiteSpace: "nowrap",
  };
  const td = {
    padding: "12px 16px",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    verticalAlign: "middle",
  };

  const hoursMap = {};
  businessHours.forEach((row) => { hoursMap[row.day_of_week] = row; });

  return (
    <div className="theme-elegant">
      <div className="page bg-dark-1" id="top">
        <nav className="main-nav dark stick-fixed">
          <Header5 links={ownerNav} logoHref="/" />
        </nav>

        <main id="main" style={{ minHeight: "100vh", paddingTop: 100 }}>
          <section className="light-content">
            <div className="container" style={{ paddingTop: 72, paddingBottom: 100 }}>

              {/* ── Page heading ── */}
              <div style={{ marginBottom: 56 }}>
                <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
                  {BUSINESS_NAME}
                </p>
                <h1 className="font-alt" style={{ fontSize: "2rem", fontWeight: 300, color: "#fff" }}>
                  Owner Dashboard
                </h1>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  Section 1 — House Call Settings
              ══════════════════════════════════════════════════════════════ */}
              <div style={{ marginBottom: 64 }}>
                <h2 style={sectionHeading}>House Call Settings</h2>

                <form action={saveHouseCallSettingsAction} style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 440 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      name="house_call_enabled"
                      value="1"
                      defaultChecked={houseCallEnabled}
                      style={{ width: 16, height: 16, accentColor: "#fff", cursor: "pointer" }}
                    />
                    <span style={{ color: "#fff", fontSize: 14 }}>Show house call option during booking</span>
                  </label>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={label}>House Call Fee (TTD $)</span>
                    <input
                      type="number"
                      name="house_call_price"
                      defaultValue={houseCallPrice}
                      min="0"
                      step="5"
                      required
                      style={{ ...inputStyle, width: 160 }}
                    />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                      Added on top of the service price when a client books a house call.
                    </span>
                  </div>

                  <div>
                    <button type="submit" style={btnPrimary}>
                      Save House Call Settings
                    </button>
                    <span style={{ marginLeft: 16, fontSize: 12, color: houseCallEnabled ? "#7ddb88" : "rgba(255,255,255,0.25)" }}>
                      {houseCallEnabled ? `Enabled · $${houseCallPrice} fee` : "Disabled"}
                    </span>
                  </div>
                </form>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  Section 2 — Weekly Schedule
              ══════════════════════════════════════════════════════════════ */}
              <div style={{ marginBottom: 64 }}>
                <h2 style={sectionHeading}>Weekly Schedule</h2>

                <form action={saveScheduleAction}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {DAY_NAMES.map((dayName, i) => {
                      const row      = hoursMap[i] ?? { is_open: false, open_time: "09:00", close_time: "17:30" };
                      const isOpen   = row.is_open;
                      const openVal  = row.open_time  ? row.open_time.substring(0, 5)  : "09:00";
                      const closeVal = row.close_time ? row.close_time.substring(0, 5) : "17:30";

                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 20,
                            flexWrap: "wrap",
                            padding: "14px 16px",
                            background: "rgba(255,255,255,0.03)",
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.06)",
                          }}
                        >
                          <span style={{ width: 100, color: isOpen ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 13 }}>
                            {dayName}
                          </span>

                          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              name={`is_open_${i}`}
                              value="1"
                              defaultChecked={isOpen}
                              style={{ width: 16, height: 16, accentColor: "#fff", cursor: "pointer" }}
                            />
                            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em" }}>
                              Open
                            </span>
                          </label>

                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ ...label, marginBottom: 0, marginRight: 4 }}>From</span>
                            <input
                              type="time"
                              name={`open_time_${i}`}
                              defaultValue={openVal}
                              style={{ ...inputStyle, width: 120 }}
                            />
                            <span style={{ ...label, marginBottom: 0, marginLeft: 4, marginRight: 4 }}>To</span>
                            <input
                              type="time"
                              name={`close_time_${i}`}
                              defaultValue={closeVal}
                              style={{ ...inputStyle, width: 120 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="submit" style={{ ...btnPrimary, marginTop: 20 }}>
                    Save Schedule
                  </button>
                </form>
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  Section 2 — Blocked Dates
              ══════════════════════════════════════════════════════════════ */}
              <div style={{ marginBottom: 64 }}>
                <h2 style={sectionHeading}>Blocked Dates</h2>

                <form action={addBlockedDateAction} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 28 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={label}>Date</span>
                    <input
                      type="date"
                      name="date"
                      required
                      style={{ ...inputStyle, width: 160 }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={label}>Reason (optional)</span>
                    <input
                      type="text"
                      name="reason"
                      placeholder="e.g. Carnival, Vacation"
                      style={{ ...inputStyle, width: 220 }}
                    />
                  </div>
                  <button type="submit" style={btnPrimary}>
                    Block This Date
                  </button>
                </form>

                {!blockedDates?.length ? (
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>No blocked dates.</p>
                ) : (
                  <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Date", "Reason", ""].map((col) => (
                            <th key={col} style={th}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {blockedDates.map((b) => (
                          <tr key={b.date}>
                            <td style={{ ...td, whiteSpace: "nowrap", color: "#fff" }}>
                              {formatDateLong(b.date).split(",").slice(0, 2).join(",")}
                            </td>
                            <td style={td}>{b.reason ?? <span style={{ color: "rgba(255,255,255,0.2)" }}>—</span>}</td>
                            <td style={td}>
                              <form action={removeBlockedDateAction}>
                                <input type="hidden" name="date" value={b.date} />
                                <button type="submit" style={btnDanger}>Remove</button>
                              </form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  Section 3 — Upcoming Bookings (next 7 days, read-only)
              ══════════════════════════════════════════════════════════════ */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 24, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <h2 style={{ ...sectionHeading, marginBottom: 0, paddingBottom: 0, border: "none" }}>
                    Next 7 Days
                  </h2>
                  <a href="/admin" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textDecoration: "none", letterSpacing: "0.04em" }}>
                    View all in Admin →
                  </a>
                </div>

                {!upcomingBookings.length ? (
                  <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 14 }}>No confirmed bookings in the next 7 days.</p>
                ) : (
                  <div style={{ overflowX: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 2 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Client", "Service", "Date", "Time", "Total"].map((col) => (
                            <th key={col} style={th}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBookings.map((b) => {
                          const dateShort   = formatDateLong(b.appointment_date).split(",").slice(0, 2).join(",");
                          const timeDisplay = formatTime12h(b.appointment_time.substring(0, 5));
                          return (
                            <tr key={b.id}>
                              <td style={{ ...td, color: "#fff", fontWeight: 500 }}>{b.client_name}</td>
                              <td style={{ ...td, whiteSpace: "nowrap" }}>{b.service_name}</td>
                              <td style={{ ...td, whiteSpace: "nowrap" }}>{dateShort}</td>
                              <td style={{ ...td, whiteSpace: "nowrap" }}>{timeDisplay}</td>
                              <td style={td}>${b.service_price + (b.house_call ? b.house_call_fee : 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
