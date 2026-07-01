// ─── Business configuration ──────────────────────────────────────────────────

export const SLOT_INTERVAL = 30; // minutes

export const SERVICES = [
  { id: 1,  name: "Haircut",                price: 80,   duration: 45,  category: "Haircuts" },
  { id: 2,  name: "Kids Haircut",           price: 50,   duration: 30,  category: "Haircuts" },
  { id: 3,  name: "Beard",                  price: 45,   duration: 30,  category: "Haircuts" },
  { id: 4,  name: "Eyebrow Marking",        price: 30,   duration: 15,  category: "Haircuts" },
  { id: 5,  name: "Retwist & Style",        price: 150,  duration: 90,  category: "Locs"     },
  { id: 6,  name: "Instant Locs",           price: 450,  duration: 180, category: "Locs"     },
  { id: 7,  name: "Loc Extensions",         price: 500,  duration: 240, category: "Locs"     },
  { id: 8,  name: "Wick Locs",             price: 1200, duration: 300, category: "Locs"     },
  { id: 9,  name: "Canerow / Twist Style",  price: 80,   duration: 90,  category: "Natural"  },
  { id: 10, name: "Braids",                 price: 300,  duration: 120, category: "Natural"  },
  { id: 11, name: "Colour / Dye",           price: 120,  duration: 90,  category: "Colour"   },
];

// ─── Slot generation ─────────────────────────────────────────────────────────

/**
 * Generate all candidate start times for a given service duration.
 * A slot is valid when slotStart + duration <= closing time.
 *
 * @param {number} duration     - service duration in minutes
 * @param {number} openMinutes  - shop open time in minutes since midnight (e.g. 540 for 09:00)
 * @param {number} closeMinutes - shop close time in minutes since midnight (e.g. 1050 for 17:30)
 * @returns {string[]} - "HH:MM" strings (24h local time)
 */
export function generateCandidateSlots(duration, openMinutes, closeMinutes) {
  const slots     = [];
  const lastStart = closeMinutes - duration;

  for (let m = openMinutes; m <= lastStart; m += SLOT_INTERVAL) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/**
 * Filter candidate slots to only those that do not overlap any existing booking.
 *
 * Overlap rule: a new booking at slot S with newDuration is BLOCKED if any
 * existing booking [existStart, existStart + existDuration) overlaps [S, S + newDuration).
 *
 * Two intervals overlap iff: A_start < B_end AND B_start < A_end
 * So slot S is blocked iff: S < existEnd AND existStart < S + newDuration
 *
 * @param {string[]} candidates - "HH:MM" slot strings
 * @param {number}   newDuration - duration of the requested service (minutes)
 * @param {Array}    existingBookings - DB rows: { appointment_time: "HH:MM:SS", duration_min: number }
 * @returns {string[]} - available subset of candidates
 */
export function filterAvailableSlots(candidates, newDuration, existingBookings) {
  return candidates.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd   = slotStart + newDuration;

    for (const booking of existingBookings) {
      const existStart = timeToMinutes(booking.appointment_time.substring(0, 5));
      const existEnd   = existStart + booking.duration_min;

      if (slotStart < existEnd && existStart < slotEnd) {
        return false; // overlap — blocked
      }
    }
    return true;
  });
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

/**
 * Convert "HH:MM" or "HH:MM:SS" to total minutes since midnight.
 */
export function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes since midnight to "HH:MM".
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Convert "HH:MM" (24h) to "H:MM AM/PM" for display.
 * Works with or without leading zero.
 */
export function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/**
 * Convert "YYYY-MM-DD" to a long display string.
 * Uses local date constructor to avoid UTC timezone shift.
 * e.g. "2026-03-03" → "Tuesday, March 3, 2026"
 */
export function formatDateLong(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const date = new Date(y, mo - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

/**
 * Convert a JS Date to "YYYY-MM-DD" using LOCAL date values.
 * Do NOT use .toISOString() — that converts to UTC first and can shift
 * the date for clients in Trinidad (UTC−4).
 */
export function toDateStr(date) {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d  = String(date.getDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * Convert local date "YYYY-MM-DD" and time "HH:MM" to a UTC ISO string.
 * Trinidad = UTC−4, no DST (America/Port_of_Spain).
 */
export function localToUtc(dateStr, timeStr) {
  const OFFSET_HOURS = -4;
  const [year, month, day]  = dateStr.split("-").map(Number);
  const [hour, minute]      = timeStr.split(":").map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hour - OFFSET_HOURS, minute);
  return new Date(utcMs).toISOString();
}
