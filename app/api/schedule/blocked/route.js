import { NextResponse } from "next/server";
import { getBlockedDates, addBlockedDate } from "@/lib/googleSheets";

/**
 * GET /api/schedule/blocked
 * Returns all blocked dates. Owner-protected via middleware.
 *
 * POST /api/schedule/blocked
 * Body: { date: "YYYY-MM-DD", reason?: string }
 * Adds a blocked date. Owner-protected via middleware.
 */

export async function GET() {
  const blocked = await getBlockedDates();
  return NextResponse.json({ blocked });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { date, reason } = body;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  try {
    const data = await addBlockedDate(date, reason?.trim() || null);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    if (err.message === "DUPLICATE") {
      return NextResponse.json(
        { error: "This date is already blocked." },
        { status: 409 }
      );
    }
    console.error("[POST /api/schedule/blocked]", err);
    return NextResponse.json({ error: "Failed to block date." }, { status: 500 });
  }
}
