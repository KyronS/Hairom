import { NextResponse } from "next/server";
import { getBusinessHours } from "@/lib/googleSheets";

/**
 * GET /api/schedule/hours
 *
 * Public endpoint — returns business hours for all 7 days of the week.
 * Used by the booking page calendar to know which days to enable.
 *
 * Response 200: { hours: [{ day_of_week, is_open, open_time, close_time }] }
 */
export async function GET() {
  const hours = await getBusinessHours();
  return NextResponse.json({ hours });
}
