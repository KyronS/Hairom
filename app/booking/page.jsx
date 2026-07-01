"use client";

import { useState, Fragment, useEffect } from "react";
import Header5 from "@/components/headers/Header5";
import Footer5 from "@/components/footers/Footer5";
import {
  SERVICES,
  formatTime12h,
  formatDateLong,
  toDateStr,
} from "@/lib/bookingUtils";
import { BUSINESS_NAME } from "@/lib/config";

const WHATSAPP_NUMBER        = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER        || "18683755357";
const BARBER_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_BARBER_WHATSAPP_NUMBER || WHATSAPP_NUMBER;

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_ABBR = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const STEP_LABELS = ["Service", "House Call", "Date & Time", "Your Details", "Confirmed"];

const bookingNav = [
  { href: "/",           text: "Home"      },
  { href: "/#about",     text: "About"     },
  { href: "/#services",  text: "Services"  },
  { href: "/#portfolio", text: "Portfolio" },
  { href: "/#contact",   text: "Contact"   },
];

// ── Shared inline style helpers ───────────────────────────────────────────────
const cardStyle = (active) => ({
  padding: "28px 24px",
  border: `1px solid ${active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: 2,
  cursor: "pointer",
  background: active ? "rgba(255,255,255,0.04)" : "transparent",
  transition: "border-color 0.2s ease, background 0.2s ease",
  height: "100%",
});

const slotStyle = (active) => ({
  padding: "11px 6px",
  border: `1px solid ${active ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)"}`,
  borderRadius: 2,
  background: active ? "rgba(255,255,255,0.07)" : "transparent",
  color: active ? "#fff" : "rgba(255,255,255,0.5)",
  cursor: "pointer",
  fontSize: 12,
  fontFamily: "inherit",
  transition: "all 0.18s ease",
  letterSpacing: "0.02em",
});

const inputStyle = {
  width: "100%",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 2,
  padding: "13px 16px",
  color: "#fff",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

const ghostLabel = {
  display: "block",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.35)",
  marginBottom: 20,
};

// ── Summary row for Step 4 ────────────────────────────────────────────────────
function Row({ label, value, large }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{label}</span>
      <span style={{ color: "#fff", fontSize: large ? 22 : 14, fontWeight: large ? 300 : 400 }}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [selectedService, setSelectedService] = useState(null);

  // Step 2 — calendar
  const todayMidnight = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const [calYear,  setCalYear]  = useState(todayMidnight.getFullYear());
  const [calMonth, setCalMonth] = useState(todayMidnight.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // Step 2 — open days (fetched from API)
  const [openDays, setOpenDays] = useState(null); // null = loading, Set<number> = loaded

  useEffect(() => {
    fetch("/api/schedule/hours")
      .then((r) => r.json())
      .then((data) => {
        const set = new Set(
          (data.hours ?? []).filter((h) => h.is_open).map((h) => h.day_of_week)
        );
        setOpenDays(set);
      })
      .catch(() => {
        // Fallback: allow all days if the fetch fails (API will return empty slots anyway)
        setOpenDays(new Set([0, 1, 2, 3, 4, 5, 6]));
      });
  }, []);

  useEffect(() => {
    fetch("/api/settings/house-call")
      .then(r => r.json())
      .then(data => {
        setHouseCallEnabled(data.enabled ?? false);
        setHouseCallFee(data.price ?? 150);
      })
      .catch(() => {});
  }, []);

  // Step 2 — slots (fetched from API)
  const [selectedTime,   setSelectedTime]   = useState(null); // "HH:MM" 24h
  const [availableSlots, setAvailableSlots] = useState([]);   // "HH:MM" 24h
  const [slotsLoading,   setSlotsLoading]   = useState(false);
  const [slotsError,     setSlotsError]     = useState(null);

  // Step 3 — client info
  const [clientName,  setClientName]  = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Step 5 — success
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // House call (step 2) — enabled/price fetched from owner settings
  const [houseCallEnabled, setHouseCallEnabled] = useState(false);
  const [houseCallFee, setHouseCallFee] = useState(150);
  const [houseCall, setHouseCall] = useState(false);


  // ── Calendar helpers ─────────────────────────────────────────────────────────
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth     = new Date(calYear, calMonth + 1, 0).getDate();

  function prevMonth() {
    const atFloor = calYear === todayMidnight.getFullYear() && calMonth === todayMidnight.getMonth();
    if (atFloor) return;
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  }
  function isDayAvailable(day) {
    const d = new Date(calYear, calMonth, day);
    if (d < todayMidnight) return false;
    if (!openDays) return false; // still loading
    return openDays.has(d.getDay());
  }
  function isSelectedDay(day) {
    if (!selectedDate) return false;
    return new Date(calYear, calMonth, day).toDateString() === selectedDate.toDateString();
  }

  // ── Fetch available slots when date or service changes ───────────────────────
  async function fetchSlots(date, serviceId) {
    setSlotsLoading(true);
    setSlotsError(null);
    setAvailableSlots([]);
    setSelectedTime(null);
    try {
      const dateStr = toDateStr(date);
      const res     = await fetch(`/api/bookings/available?date=${dateStr}&serviceId=${serviceId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAvailableSlots(data.slots ?? []);
    } catch {
      setSlotsError("Could not load available times. Please try again.");
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDateSelect(day) {
    if (!isDayAvailable(day)) return;
    const date = new Date(calYear, calMonth, day);
    setSelectedDate(date);
    if (selectedService) fetchSlots(date, selectedService);
  }

  // ── Submit booking (Step 3 → Step 4) ────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError(null);

    if (!clientName.trim() || !clientEmail.trim()) {
      setSubmitError("Please fill in your name and email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          serviceId:   selectedService,
          date:        toDateStr(selectedDate),
          time:        selectedTime,
          clientName:  clientName.trim(),
          clientEmail: clientEmail.trim(),
          clientPhone: clientPhone.trim() || undefined,
          houseCall:   houseCall,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Slot was just taken — send back to Step 3 (date & time) to re-select
        setSelectedTime(null);
        setAvailableSlots([]);
        if (selectedDate && selectedService) fetchSlots(selectedDate, selectedService);
        setStep(3);
        setSlotsError(data.error || "That slot was just taken. Please choose another time.");
        return;
      }

      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setConfirmedBooking(data);
      setStep(5);

      // Notify barber via WhatsApp (triggered synchronously during user action
      // so popup blockers allow it)
      const ref  = data.id.slice(-8).toUpperCase();
      const text = encodeURIComponent(
        `New booking confirmed!\n\n` +
        `Client: ${data.clientName}\n` +
        `Service: ${data.serviceName}\n` +
        `Date: ${formatDateLong(data.date)}\n` +
        `Time: ${formatTime12h(data.time)}\n` +
        (data.houseCall ? `House Call: Yes (+$${data.houseCallFee})\n` : "") +
        `Ref: ${ref}`
      );
      window.open(`https://wa.me/${BARBER_WHATSAPP_NUMBER}?text=${text}`, "_blank");
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── WhatsApp (Step 4 — optional) ─────────────────────────────────────────────
  function openWhatsApp() {
    if (!confirmedBooking) return;
    const ref  = confirmedBooking.id.slice(-8).toUpperCase();
    const text = encodeURIComponent(
      `Hi Hairom! I have a question about my booking.\n` +
      `Reference: ${ref}\n` +
      `Service: ${confirmedBooking.serviceName}\n` +
      `Date: ${formatDateLong(confirmedBooking.date)}\n` +
      `Time: ${formatTime12h(confirmedBooking.time)}` +
      (confirmedBooking.houseCall ? `\nHouse Call: Yes (+$${confirmedBooking.houseCallFee})` : "")
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  }

  // ── Reset all state ───────────────────────────────────────────────────────────
  function resetAll() {
    setStep(1);
    setSelectedService(null);
    setHouseCall(false);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    setSlotsLoading(false);
    setSlotsError(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setSubmitError(null);
    setConfirmedBooking(null);
  }

  const selectedSvc = SERVICES.find(s => s.id === selectedService);

  // ──────────────────────────────────────────────────────────────────────────────
  return (
    <div className="theme-elegant">
      <div className="page bg-dark-1" id="top">

        <nav className="main-nav dark stick-fixed">
          <Header5 links={bookingNav} logoHref="/" />
        </nav>

        <main id="main" style={{ minHeight: "100vh", paddingTop: 100 }}>
          <section className="light-content">
            <div className="container" style={{ paddingTop: 72, paddingBottom: 100 }}>

              {/* ── Page heading ── */}
              <div className="text-center" style={{ marginBottom: 56 }}>
                <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>
                  {BUSINESS_NAME}
                </p>
                <h1 className="font-alt" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 300, color: "#fff", marginBottom: 12 }}>
                  Book an Appointment
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 0 }}>
                  Simple steps to schedule your visit
                </p>
              </div>

              {/* ── Step indicator ── */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", marginBottom: 64 }}>
                {STEP_LABELS.map((label, i) => {
                  const s        = i + 1;
                  const isActive = step === s;
                  const isDone   = step > s;
                  return (
                    <Fragment key={s}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 64 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          border: `1px solid ${isActive || isDone ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)"}`,
                          background: isActive ? "#fff" : "transparent",
                          color: isActive ? "#111" : isDone ? "#fff" : "rgba(255,255,255,0.28)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 500, transition: "all 0.3s ease",
                        }}>
                          {isDone ? "✓" : s}
                        </div>
                        <span style={{
                          fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
                          color: isActive ? "#fff" : "rgba(255,255,255,0.28)",
                          marginTop: 8, whiteSpace: "nowrap", transition: "color 0.3s ease",
                        }}>
                          {label}
                        </span>
                      </div>
                      {s < 5 && (
                        <div style={{
                          width: 60, height: 1, marginTop: 18, flexShrink: 0,
                          background: step > s ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.1)",
                          transition: "background 0.3s ease",
                        }} />
                      )}
                    </Fragment>
                  );
                })}
              </div>

              {/* ══════════════════════════════════════════════════════
                  STEP 1 — Select Service
              ══════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-10">
                    <div className="row g-4">
                      {SERVICES.map((svc) => (
                        <div key={svc.id} className="col-12 col-sm-6 col-lg-4">
                          <div onClick={() => setSelectedService(svc.id)} style={cardStyle(selectedService === svc.id)}>
                            <p style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                              {svc.category}
                            </p>
                            <h5 className="font-alt" style={{ fontWeight: 400, fontSize: 17, color: "#fff", marginBottom: 24 }}>
                              {svc.name}
                            </h5>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{svc.duration} min</span>
                              <span style={{ color: "#fff", fontSize: 20, fontWeight: 300 }}>${svc.price}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center" style={{ marginTop: 56 }}>
                      <button
                        onClick={() => setStep(houseCallEnabled ? 2 : 3)}
                        disabled={!selectedService}
                        className="btn btn-mod btn-border-w btn-medium btn-circle"
                        style={{ opacity: selectedService ? 1 : 0.3, transition: "opacity 0.2s" }}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  STEP 2 — House Call Option
              ══════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="row justify-content-center">
                  <div className="col-12 col-xl-8">
                    <div className="row g-4 justify-content-center">
                      {[
                        {
                          value: false,
                          title: "Salon Visit",
                          desc: "Come to us at our San Fernando location. No extra charge.",
                        },
                        {
                          value: true,
                          title: "House Call",
                          desc: `We come to you. An additional house call fee of $${houseCallFee} applies on top of the service price.`,
                        },
                      ].map(({ value, title, desc }) => (
                        <div key={String(value)} className="col-12 col-sm-6 col-lg-5">
                          <div onClick={() => setHouseCall(value)} style={cardStyle(houseCall === value)}>
                            <h5 className="font-alt" style={{ fontWeight: 400, fontSize: 17, color: "#fff", marginBottom: 12 }}>
                              {title}
                            </h5>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center" style={{ marginTop: 56 }}>
                      <button onClick={() => setStep(1)} className="btn btn-mod btn-border btn-medium btn-circle" style={{ marginRight: 12 }}>
                        Back
                      </button>
                      <button onClick={() => setStep(3)} className="btn btn-mod btn-border-w btn-medium btn-circle">
                        Continue
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  STEP 3 — Select Date & Time
              ══════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="row g-5 justify-content-center">

                  {/* Calendar */}
                  <div className="col-12 col-md-6 col-lg-5">
                    <span style={ghostLabel}>Select Date</span>
                    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 2, padding: "28px 24px" }}>

                      {/* Month navigation */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                        <button onClick={prevMonth} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 8px" }}>
                          &#8592;
                        </button>
                        <span style={{ color: "#fff", fontSize: 14, letterSpacing: "0.06em" }}>
                          {MONTH_NAMES[calMonth]} {calYear}
                        </span>
                        <button onClick={nextMonth} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: "2px 8px" }}>
                          &#8594;
                        </button>
                      </div>

                      {/* Calendar grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                        {DAY_ABBR.map(d => (
                          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.22)", letterSpacing: "0.04em", paddingBottom: 10 }}>
                            {d}
                          </div>
                        ))}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`e-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day   = i + 1;
                          const avail = isDayAvailable(day);
                          const sel   = isSelectedDay(day);
                          return (
                            <button
                              key={day}
                              onClick={() => handleDateSelect(day)}
                              disabled={!avail}
                              style={{
                                background: sel ? "#fff" : "transparent",
                                border: "none",
                                borderRadius: 2,
                                color: sel ? "#111" : avail ? "#fff" : "rgba(255,255,255,0.16)",
                                cursor: avail ? "pointer" : "default",
                                fontSize: 13,
                                padding: "8px 0",
                                fontFamily: "inherit",
                                transition: "all 0.18s ease",
                                textAlign: "center",
                              }}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      {openDays && openDays.size > 0 && (
                        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", textAlign: "center", marginTop: 18, marginBottom: 0, letterSpacing: "0.08em" }}>
                          AVAILABLE:{" "}
                          {["SUN","MON","TUE","WED","THU","FRI","SAT"]
                            .filter((_, i) => openDays.has(i))
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time slots */}
                  <div className="col-12 col-md-6 col-lg-5">
                    <span style={ghostLabel}>Select Time</span>

                    {!selectedDate ? (
                      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "52px 24px", textAlign: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 13, margin: 0 }}>Please select a date first</p>
                      </div>
                    ) : slotsLoading ? (
                      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "52px 24px", textAlign: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: 0 }}>Loading available times...</p>
                      </div>
                    ) : slotsError ? (
                      <div style={{ border: "1px solid rgba(255,80,80,0.25)", borderRadius: 2, padding: "32px 24px" }}>
                        <p style={{ color: "#ff8080", fontSize: 13, margin: 0 }}>{slotsError}</p>
                        <button
                          onClick={() => fetchSlots(selectedDate, selectedService)}
                          style={{ marginTop: 12, background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)", borderRadius: 2, padding: "6px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Retry
                        </button>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "52px 24px", textAlign: "center" }}>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 8 }}>No availability on this date.</p>
                        <p style={{ color: "rgba(255,255,255,0.22)", fontSize: 12, margin: 0 }}>Please choose another day.</p>
                      </div>
                    ) : (
                      <>
                        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginBottom: 20 }}>
                          {formatDateLong(toDateStr(selectedDate))}
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              style={slotStyle(selectedTime === slot)}
                            >
                              {formatTime12h(slot)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step navigation */}
                  <div className="col-12 text-center" style={{ marginTop: 8 }}>
                    <button onClick={() => setStep(houseCallEnabled ? 2 : 1)} className="btn btn-mod btn-border btn-medium btn-circle" style={{ marginRight: 12 }}>
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      disabled={!selectedDate || !selectedTime}
                      className="btn btn-mod btn-border-w btn-medium btn-circle"
                      style={{ opacity: selectedDate && selectedTime ? 1 : 0.3, transition: "opacity 0.2s" }}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  STEP 4 — Client Info
              ══════════════════════════════════════════════════════ */}
              {step === 4 && selectedSvc && (
                <div className="row justify-content-center">
                  <div className="col-12 col-md-8 col-lg-5">

                    {/* Booking summary recap */}
                    <div style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "20px 24px", marginBottom: 28 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <span style={{ color: "#fff", fontSize: 14 }}>{selectedSvc.name}</span>
                        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>${selectedSvc.price}</span>
                      </div>
                      {houseCall && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>House Call Fee</span>
                          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>+${houseCallFee}</span>
                        </div>
                      )}
                      {houseCall && (
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                          <span style={{ color: "#fff", fontSize: 13 }}>Total</span>
                          <span style={{ color: "#fff", fontSize: 13, fontWeight: 400 }}>${selectedSvc.price + houseCallFee}</span>
                        </div>
                      )}
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: 0 }}>
                        {formatDateLong(toDateStr(selectedDate))} &middot; {formatTime12h(selectedTime)}
                      </p>
                    </div>

                    {/* Client info form */}
                    <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ ...ghostLabel, marginBottom: 8 }}>Full Name *</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={e => setClientName(e.target.value)}
                          placeholder="Your full name"
                          required
                          style={inputStyle}
                        />
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label style={{ ...ghostLabel, marginBottom: 8 }}>Email Address *</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={e => setClientEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                          style={inputStyle}
                        />
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 6, marginBottom: 0 }}>
                          A confirmation will be sent to this address.
                        </p>
                      </div>

                      <div style={{ marginBottom: 32 }}>
                        <label style={{ ...ghostLabel, marginBottom: 8 }}>
                          Phone Number <span style={{ color: "rgba(255,255,255,0.25)" }}>(optional)</span>
                        </label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={e => setClientPhone(e.target.value)}
                          placeholder="+1 868 XXX XXXX"
                          style={inputStyle}
                        />
                      </div>

                      {submitError && (
                        <div style={{ border: "1px solid rgba(255,80,80,0.3)", borderRadius: 2, padding: "14px 18px", marginBottom: 24 }}>
                          <p style={{ color: "#ff8080", fontSize: 13, margin: 0 }}>{submitError}</p>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="btn btn-mod btn-border-w btn-medium btn-circle w-100"
                        style={{ opacity: submitting ? 0.6 : 1, transition: "opacity 0.2s" }}
                      >
                        {submitting ? "Confirming..." : "Confirm Booking"}
                      </button>
                    </form>

                    <div className="text-center" style={{ marginTop: 20 }}>
                      <button
                        onClick={() => setStep(3)}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12, letterSpacing: "0.04em" }}
                      >
                        &#8592; Change date or time
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════
                  STEP 5 — Success / Confirmed
              ══════════════════════════════════════════════════════ */}
              {step === 5 && confirmedBooking && (
                <div className="row justify-content-center">
                  <div className="col-12 col-md-8 col-lg-5">
                    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 2, padding: "48px 40px" }}>

                      <p style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
                        Booking Confirmed
                      </p>
                      <h2 className="font-alt" style={{ fontSize: "1.8rem", fontWeight: 300, color: "#fff", marginBottom: 8 }}>
                        See you soon, {confirmedBooking.clientName.split(" ")[0]}.
                      </h2>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, marginBottom: 36 }}>
                        A confirmation was sent to {confirmedBooking.clientEmail}
                      </p>

                      <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <Row label="Service"  value={confirmedBooking.serviceName} />
                        <Row label="Date"     value={formatDateLong(confirmedBooking.date)} />
                        <Row label="Time"     value={formatTime12h(confirmedBooking.time)} />
                        <Row label="Duration" value={`${confirmedBooking.duration} min`} />
                        {confirmedBooking.houseCall && (
                          <Row label="House Call Fee" value={`+$${confirmedBooking.houseCallFee}`} />
                        )}
                        <Row
                          label="Total"
                          value={`$${confirmedBooking.servicePrice + (confirmedBooking.houseCall ? confirmedBooking.houseCallFee : 0)}`}
                          large
                        />
                      </div>

                      <p style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 32 }}>
                        Ref: {confirmedBooking.id.slice(-8).toUpperCase()}
                      </p>

                      <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 12, lineHeight: 1.8, marginBottom: 20 }}>
                        Have a question or need to reschedule? Message us on WhatsApp.
                      </p>
                      <button
                        onClick={openWhatsApp}
                        className="btn btn-mod btn-border btn-medium btn-circle w-100"
                        style={{ marginBottom: 16 }}
                      >
                        Message via WhatsApp
                      </button>
                    </div>

                    <div className="text-center" style={{ marginTop: 24 }}>
                      <button
                        onClick={resetAll}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 12, letterSpacing: "0.04em" }}
                      >
                        Book another appointment
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </section>
        </main>

        <footer className="bg-dark-1 light-content footer z-index-1 position-relative">
          <Footer5 />
        </footer>
      </div>
    </div>
  );
}
