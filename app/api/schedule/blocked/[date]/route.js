import { NextResponse } from "next/server";
import { removeBlockedDate } from "@/lib/googleSheets";

/**
 * DELETE /api/schedule/blocked/{date}
 * Removes a blocked date by its date string (YYYY-MM-DD).
 * Owner-protected via middleware.
 *
 * Response 200: { date }
 * Response 400: invalid date format
 * Response 404: date not found
 */
export async function DELETE(request, { params }) {
  const { date } = params;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD." },
      { status: 400 }
    );
  }

  const removed = await removeBlockedDate(date);

  if (!removed) {
    return NextResponse.json({ error: "Blocked date not found." }, { status: 404 });
  }

  return NextResponse.json({ date });
}
