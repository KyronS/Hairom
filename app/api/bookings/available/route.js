import { NextResponse } from "next/server";
import { getHoursForDay, isDateBlocked, getBookingsForDate } from "@/lib/googleSheets";
import {
  SERVICES,
  generateCandidateSlots,
  filterAvailableSlots,
  timeToMinutes,
} from "@/lib/bookingUtils";

/**
 * GET /api/bookings/available?date=YYYY-MM-DD&serviceId=N
 *
 * Returns available time slot strings ("HH:MM") for the given date and service,
 * accounting for business hours, blocked dates, and existing booking overlaps.
 *
 * Response 200: { slots: string[], date: string, serviceId: number, duration: number }
 * Response 400: { error: string }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateStr   = searchParams.get("date");
  const serviceId = parseInt(searchParams.get("serviceId"), 10);

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "Missing or invalid date. Use YYYY-MM-DD format." },
      { status: 400 }
    );
  }

  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Invalid serviceId." }, { status: 400 });
  }

  const [y, mo, d] = dateStr.split("-").map(Number);
  const requestedDate = new Date(y, mo - 1, d);
  const todayLocal    = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  if (requestedDate < todayLocal) {
    return NextResponse.json({
      slots: [], date: dateStr, serviceId, duration: service.duration,
    });
  }

  const dayOfWeek = requestedDate.getDay();

  const [hoursRow, blocked, existingBookings] = await Promise.all([
    getHoursForDay(dayOfWeek),
    isDateBlocked(dateStr),
    getBookingsForDate(dateStr),
  ]);

  if (!hoursRow?.is_open || blocked) {
    return NextResponse.json({
      slots: [], date: dateStr, serviceId, duration: service.duration,
    });
  }

  const openMinutes  = timeToMinutes(hoursRow.open_time.substring(0, 5));
  const closeMinutes = timeToMinutes(hoursRow.close_time.substring(0, 5));
  const candidates   = generateCandidateSlots(service.duration, openMinutes, closeMinutes);
  const available    = filterAvailableSlots(candidates, service.duration, existingBookings);

  return NextResponse.json({
    slots:     available,
    date:      dateStr,
    serviceId: serviceId,
    duration:  service.duration,
  });
}
