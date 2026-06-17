import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import {
  getHoursForDay,
  isDateBlocked,
  getBookingsForDate,
  createBooking,
  getAllBookings,
} from "@/lib/googleSheets";
import { acquireLock, releaseLock } from "@/lib/bookingLock";
import {
  SERVICES,
  generateCandidateSlots,
  filterAvailableSlots,
  timeToMinutes,
  formatTime12h,
  formatDateLong,
} from "@/lib/bookingUtils";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 8000,
  greetingTimeout:   8000,
  socketTimeout:     8000,
});

// ── POST: Create a new booking ─────────────────────────────────────────────────
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { serviceId, date, time, clientName, clientEmail, clientPhone } = body;

  // ── Input validation ─────────────────────────────────────────────────────────
  const service = SERVICES.find((s) => s.id === parseInt(serviceId, 10));
  if (!service) {
    return NextResponse.json({ error: "Invalid serviceId." }, { status: 400 });
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
  }
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return NextResponse.json({ error: "Invalid time. Use HH:MM (24h)." }, { status: 400 });
  }

  const [dy, dmo, dd] = date.split("-").map(Number);
  const requestedDate = new Date(dy, dmo - 1, dd);
  const todayLocal    = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  if (requestedDate < todayLocal) {
    return NextResponse.json({ error: "Selected date is in the past." }, { status: 400 });
  }

  if (!clientName?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!clientEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  // ── Check business hours and blocked dates ────────────────────────────────────
  const dayOfWeek = requestedDate.getDay();
  const [hoursRow, blocked] = await Promise.all([
    getHoursForDay(dayOfWeek),
    isDateBlocked(date),
  ]);

  if (!hoursRow?.is_open || blocked) {
    return NextResponse.json(
      { error: "Selected date is not a valid business day." },
      { status: 400 }
    );
  }

  // ── Acquire distributed lock before reading/writing the bookings sheet ────────
  const lockKey = await acquireLock(date);
  if (!lockKey) {
    return NextResponse.json(
      { error: "System is temporarily busy. Please try again in a moment." },
      { status: 503 }
    );
  }

  try {
    // ── Re-check availability inside the lock (prevents race conditions) ──────
    const existingBookings = await getBookingsForDate(date);
    const openMinutes  = timeToMinutes(hoursRow.open_time.substring(0, 5));
    const closeMinutes = timeToMinutes(hoursRow.close_time.substring(0, 5));
    const candidates   = generateCandidateSlots(service.duration, openMinutes, closeMinutes);
    const available    = filterAvailableSlots(candidates, service.duration, existingBookings);

    if (!available.includes(time)) {
      return NextResponse.json(
        { error: "This time slot is no longer available. Please choose another." },
        { status: 409 }
      );
    }

    // ── Write the booking ──────────────────────────────────────────────────────
    const newBooking = await createBooking({
      service_id:       service.id,
      service_name:     service.name,
      service_price:    service.price,
      duration_min:     service.duration,
      appointment_date: date,
      appointment_time: time,
      client_name:      clientName.trim(),
      client_email:     clientEmail.trim().toLowerCase(),
      client_phone:     clientPhone?.trim() || null,
    });

    // ── Send emails (fire-and-forget — does not block the response) ────────────
    sendEmails(newBooking).catch((err) => {
      console.error("[email] Send failed:", err.message, err.code);
    });

    return NextResponse.json(
      {
        id:           newBooking.id,
        serviceName:  newBooking.service_name,
        servicePrice: newBooking.service_price,
        duration:     newBooking.duration_min,
        date:         newBooking.appointment_date,
        time:         newBooking.appointment_time,
        clientName:   newBooking.client_name,
        clientEmail:  newBooking.client_email,
      },
      { status: 201 }
    );
  } finally {
    await releaseLock(lockKey);
  }
}

// ── GET: List bookings (admin — protected by middleware) ──────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const includePast  = searchParams.get("include_past") === "true";

  const bookings = await getAllBookings({ statusFilter, includePast });
  return NextResponse.json({ bookings });
}

// ── Email helpers ─────────────────────────────────────────────────────────────

async function sendEmails(booking) {
  const displayDate = formatDateLong(booking.appointment_date);
  const displayTime = formatTime12h(booking.appointment_time.substring(0, 5));
  const ref         = booking.id.slice(-8).toUpperCase();

  await Promise.all([
    transporter.sendMail({
      from:    `"Hairom Barbershop" <${process.env.GMAIL_USER}>`,
      to:      booking.client_email,
      subject: `Appointment Confirmed — ${displayDate} at ${displayTime}`,
      html:    buildClientEmail({ booking, displayDate, displayTime, ref }),
    }),
    transporter.sendMail({
      from:    `"Hairom Barbershop" <${process.env.GMAIL_USER}>`,
      to:      process.env.BARBER_EMAIL,
      subject: `New Booking: ${booking.service_name} — ${displayDate} at ${displayTime}`,
      html:    buildBarberEmail({ booking, displayDate, displayTime, ref }),
    }),
  ]);
}

function buildClientEmail({ booking, displayDate, displayTime, ref }) {
  const firstName = booking.client_name.split(" ")[0];
  const waNumber  = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "18683755357";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff}
  .wrap{max-width:520px;margin:0 auto;padding:48px 32px}
  .label{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:12px}
  h1{font-size:26px;font-weight:300;margin:0 0 10px}
  .sub{color:rgba(255,255,255,.4);font-size:14px;margin-bottom:36px}
  hr{border:none;border-top:1px solid rgba(255,255,255,.08);margin:28px 0}
  .row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:14px}
  .rl{color:rgba(255,255,255,.4);font-size:12px}
  .rv{color:#fff;font-size:13px}
  .rv-large{color:#fff;font-size:20px;font-weight:300}
  .ref{font-size:11px;color:rgba(255,255,255,.25);letter-spacing:.08em}
  .cta{display:inline-block;margin-top:28px;padding:13px 28px;border:1px solid rgba(255,255,255,.35);color:#fff;text-decoration:none;font-size:12px;letter-spacing:.06em;border-radius:2px}
  .footer{margin-top:48px;font-size:11px;color:rgba(255,255,255,.22);line-height:1.9}
</style>
</head>
<body>
<div class="wrap">
  <p class="label">Hairom Barbershop</p>
  <h1>Your appointment is confirmed.</h1>
  <p class="sub">We look forward to seeing you, ${firstName}.</p>
  <hr>
  <div class="row"><span class="rl">Service</span><span class="rv">${booking.service_name}</span></div>
  <div class="row"><span class="rl">Date</span><span class="rv">${displayDate}</span></div>
  <div class="row"><span class="rl">Time</span><span class="rv">${displayTime}</span></div>
  <div class="row"><span class="rl">Duration</span><span class="rv">${booking.duration_min} minutes</span></div>
  <div class="row"><span class="rl">Price</span><span class="rv rv-large">$${booking.service_price}</span></div>
  <hr>
  <p class="ref">Booking reference: ${ref}</p>
  <p style="color:rgba(255,255,255,.35);font-size:13px;margin-top:28px;line-height:1.7">
    Need to reschedule or have a question? Reach us on WhatsApp.
  </p>
  <a class="cta" href="https://wa.me/${waNumber}">Message Hairom</a>
  <div class="footer">
    <p>Hairom Barbershop &mdash; Crown Adjusted Successfully</p>
    <p>Please arrive a few minutes early. If you need to cancel, please message us on WhatsApp as soon as possible.</p>
  </div>
</div>
</body>
</html>`;
}

function buildBarberEmail({ booking, displayDate, displayTime, ref }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body{margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff}
  .wrap{max-width:520px;margin:0 auto;padding:40px 32px}
  .badge{display:inline-block;background:rgba(100,200,100,.12);border:1px solid rgba(100,200,100,.28);color:#7ddb88;font-size:10px;letter-spacing:.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:24px}
  h2{font-size:20px;font-weight:400;margin:0 0 28px}
  .row{display:flex;justify-content:space-between;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .rl{color:rgba(255,255,255,.38);font-size:12px}
  .rv{color:#fff;font-size:13px}
  .note{margin-top:28px;color:rgba(255,255,255,.28);font-size:12px;line-height:1.8}
</style>
</head>
<body>
<div class="wrap">
  <div class="badge">New Booking</div>
  <h2>${booking.service_name} &mdash; ${displayDate}</h2>
  <div class="row"><span class="rl">Client</span><span class="rv">${booking.client_name}</span></div>
  <div class="row"><span class="rl">Email</span><span class="rv">${booking.client_email}</span></div>
  <div class="row"><span class="rl">Phone</span><span class="rv">${booking.client_phone ?? "Not provided"}</span></div>
  <div class="row"><span class="rl">Service</span><span class="rv">${booking.service_name}</span></div>
  <div class="row"><span class="rl">Date</span><span class="rv">${displayDate}</span></div>
  <div class="row"><span class="rl">Time</span><span class="rv">${displayTime}</span></div>
  <div class="row"><span class="rl">Duration</span><span class="rv">${booking.duration_min} min</span></div>
  <div class="row"><span class="rl">Price</span><span class="rv">$${booking.service_price}</span></div>
  <div class="row"><span class="rl">Reference</span><span class="rv" style="font-size:11px;opacity:.5">${ref}</span></div>
  <p class="note">Manage bookings at <a href="/admin" style="color:rgba(255,255,255,.45)">/admin</a></p>
</div>
</body>
</html>`;
}
