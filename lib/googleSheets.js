import { randomUUID } from "crypto";
import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

const SHEET = {
  BOOKINGS: "Bookings",
  SCHEDULE: "Schedule",
  BLOCKED:  "BlockedDates",
  SETTINGS: "Settings",
};

// 0-based column positions in the Bookings sheet
const B = {
  ID:             0,
  SVC_ID:         1,
  SVC_NAME:       2,
  SVC_PRICE:      3,
  DURATION:       4,
  DATE:           5,
  TIME:           6,
  CLIENT_NAME:    7,
  CLIENT_EMAIL:   8,
  CLIENT_PHONE:   9,
  STATUS:         10,
  CANCELLED_AT:   11,
  CREATED_AT:     12,
  HOUSE_CALL:     13,
  HOUSE_CALL_FEE: 14,
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function getClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

// Returns all data rows (A2 onwards), excluding the header
async function readRows(sheetName) {
  const res = await getClient().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`,
  });
  return res.data.values ?? [];
}

async function appendRow(sheetName, values) {
  await getClient().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

// dataRowIndex is 0-based within the data array (excludes the header row)
async function updateRow(sheetName, dataRowIndex, values) {
  const sheetRow = dataRowIndex + 2; // +1 for 1-based indexing, +1 for header
  await getClient().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [values] },
  });
}

async function deleteRow(sheetName, dataRowIndex) {
  const client = getClient();
  const { data } = await client.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = data.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  await client.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId:    sheet.properties.sheetId,
            dimension:  "ROWS",
            startIndex: dataRowIndex + 1, // +1 to skip header row (0-indexed in the API)
            endIndex:   dataRowIndex + 2,
          },
        },
      }],
    },
  });
}

// Converts a local Trinidad (UTC-4) appointment to a UTC Date for time comparison
function apptToUtcDate(appointment_date, appointment_time) {
  const [y, mo, d] = appointment_date.split("-").map(Number);
  const [h, m]     = appointment_time.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + 4, m));
}

function rowToBooking(row) {
  return {
    id:               row[B.ID],
    service_id:       Number(row[B.SVC_ID]),
    service_name:     row[B.SVC_NAME],
    service_price:    Number(row[B.SVC_PRICE]),
    duration_min:     Number(row[B.DURATION]),
    appointment_date: row[B.DATE],
    appointment_time: row[B.TIME],
    client_name:      row[B.CLIENT_NAME],
    client_email:     row[B.CLIENT_EMAIL],
    client_phone:     row[B.CLIENT_PHONE] || null,
    status:           row[B.STATUS],
    cancelled_at:     row[B.CANCELLED_AT] || null,
    created_at:       row[B.CREATED_AT],
    house_call:       row[B.HOUSE_CALL] === "TRUE",
    house_call_fee:   Number(row[B.HOUSE_CALL_FEE] ?? 0) || 0,
  };
}

// ── Booking reads ──────────────────────────────────────────────────────────────

// Returns the minimal shape needed by filterAvailableSlots
export async function getBookingsForDate(date) {
  const rows = await readRows(SHEET.BOOKINGS);
  return rows
    .filter(r => r[B.DATE] === date && r[B.STATUS] === "confirmed")
    .map(r => ({
      appointment_time: r[B.TIME],
      duration_min:     Number(r[B.DURATION]),
    }));
}

export async function getAllBookings({ statusFilter, includePast } = {}) {
  const rows = await readRows(SHEET.BOOKINGS);
  const now  = new Date();

  let bookings = rows.map(rowToBooking);

  if (statusFilter === "confirmed" || statusFilter === "cancelled") {
    bookings = bookings.filter(b => b.status === statusFilter);
  }
  if (!includePast) {
    bookings = bookings.filter(b =>
      apptToUtcDate(b.appointment_date, b.appointment_time) >= now
    );
  }

  return bookings.sort((a, b) => {
    const ta = `${a.appointment_date}T${a.appointment_time}`;
    const tb = `${b.appointment_date}T${b.appointment_time}`;
    return ta.localeCompare(tb);
  });
}

// Computes the two stats shown on the admin dashboard header
export async function getAdminStats() {
  const rows  = await readRows(SHEET.BOOKINGS);
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);

  const confirmed = rows.filter(r => r[B.STATUS] === "confirmed");
  return {
    totalUpcoming: confirmed.filter(r => apptToUtcDate(r[B.DATE], r[B.TIME]) >= now).length,
    totalToday:    confirmed.filter(r => r[B.DATE] === today).length,
  };
}

// ── Booking writes ─────────────────────────────────────────────────────────────

// Must be called inside an acquired lock
export async function createBooking(data) {
  const id  = randomUUID();
  const now = new Date().toISOString();

  await appendRow(SHEET.BOOKINGS, [
    id,
    data.service_id,
    data.service_name,
    data.service_price,
    data.duration_min,
    data.appointment_date,
    data.appointment_time,
    data.client_name,
    data.client_email,
    data.client_phone ?? "",
    "confirmed",
    "",   // cancelled_at — empty until cancelled
    now,
    data.house_call ? "TRUE" : "FALSE",
    data.house_call_fee ?? 0,
  ]);

  return {
    id,
    service_id:       data.service_id,
    service_name:     data.service_name,
    service_price:    data.service_price,
    duration_min:     data.duration_min,
    appointment_date: data.appointment_date,
    appointment_time: data.appointment_time,
    client_name:      data.client_name,
    client_email:     data.client_email,
    client_phone:     data.client_phone ?? null,
    status:           "confirmed",
    created_at:       now,
    house_call:       data.house_call ?? false,
    house_call_fee:   data.house_call_fee ?? 0,
  };
}

// Finds a booking by UUID, cancels it, and returns the updated record.
// Returns { notFound: true } or { alreadyCancelled: true } on error cases.
export async function findAndCancelBooking(id) {
  const rows = await readRows(SHEET.BOOKINGS);
  const idx  = rows.findIndex(r => r[B.ID] === id);
  if (idx === -1) return { notFound: true };

  const booking = rowToBooking(rows[idx]);
  if (booking.status === "cancelled") return { alreadyCancelled: true };

  const cancelledAt = new Date().toISOString();
  await updateRow(SHEET.BOOKINGS, idx, [
    booking.id,
    booking.service_id,
    booking.service_name,
    booking.service_price,
    booking.duration_min,
    booking.appointment_date,
    booking.appointment_time,
    booking.client_name,
    booking.client_email,
    booking.client_phone ?? "",
    "cancelled",
    cancelledAt,
    booking.created_at,
    booking.house_call ? "TRUE" : "FALSE",
    booking.house_call_fee ?? 0,
  ]);

  return { booking: { ...booking, status: "cancelled", cancelled_at: cancelledAt } };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export async function getBusinessHours() {
  const rows = await readRows(SHEET.SCHEDULE);
  return rows.map(r => ({
    day_of_week: Number(r[0]),
    day_name:    r[1],
    is_open:     r[2] === "TRUE",
    open_time:   r[3] || null,
    close_time:  r[4] || null,
  }));
}

export async function getHoursForDay(dayOfWeek) {
  const hours = await getBusinessHours();
  return hours.find(h => h.day_of_week === dayOfWeek) ?? null;
}

// Overwrites all 7 schedule rows atomically.
// weekRows = [{ day_of_week, is_open, open_time, close_time }, ...]
export async function saveSchedule(weekRows) {
  const values = weekRows.map(r => [
    r.day_of_week,
    DAY_NAMES[r.day_of_week],
    r.is_open ? "TRUE" : "FALSE",
    r.is_open ? (r.open_time  ?? "") : "",
    r.is_open ? (r.close_time ?? "") : "",
  ]);

  await getClient().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET.SCHEDULE}!A2:E8`,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// ── Blocked dates ─────────────────────────────────────────────────────────────

export async function getBlockedDates() {
  const rows = await readRows(SHEET.BLOCKED);
  return rows.map(r => ({ date: r[0], reason: r[1] || null, created_at: r[2] }));
}

export async function isDateBlocked(date) {
  const rows = await readRows(SHEET.BLOCKED);
  return rows.some(r => r[0] === date);
}

export async function addBlockedDate(date, reason) {
  const rows = await readRows(SHEET.BLOCKED);
  if (rows.some(r => r[0] === date)) throw new Error("DUPLICATE");
  const now = new Date().toISOString();
  await appendRow(SHEET.BLOCKED, [date, reason ?? "", now]);
  return { date, reason: reason ?? null, created_at: now };
}

export async function removeBlockedDate(date) {
  const rows = await readRows(SHEET.BLOCKED);
  const idx  = rows.findIndex(r => r[0] === date);
  if (idx === -1) return false;
  await deleteRow(SHEET.BLOCKED, idx);
  return true;
}

// ── Settings (key/value store in Settings sheet) ───────────────────────────────

export async function getSettings() {
  try {
    const rows = await readRows(SHEET.SETTINGS);
    const obj = {};
    rows.forEach(r => { if (r[0]) obj[r[0]] = r[1] ?? ""; });
    return obj;
  } catch {
    return {};
  }
}

export async function updateSetting(key, value) {
  const rows = await readRows(SHEET.SETTINGS);
  const idx  = rows.findIndex(r => r[0] === key);
  if (idx === -1) {
    await appendRow(SHEET.SETTINGS, [key, String(value)]);
  } else {
    await updateRow(SHEET.SETTINGS, idx, [key, String(value)]);
  }
}
