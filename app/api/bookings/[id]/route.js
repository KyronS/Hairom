import { NextResponse } from "next/server";
import { findAndCancelBooking } from "@/lib/googleSheets";
import { isAdminAuthed, unauthorizedJson } from "@/lib/requireAdminAuth";

export async function PATCH(request, { params }) {
  if (!isAdminAuthed(request)) return unauthorizedJson();
  const { id } = params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid booking ID." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.action !== "cancel") {
    return NextResponse.json(
      { error: "Only action=cancel is supported." },
      { status: 400 }
    );
  }

  const result = await findAndCancelBooking(id);

  if (result.notFound) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (result.alreadyCancelled) {
    return NextResponse.json({ error: "Booking is already cancelled." }, { status: 409 });
  }

  return NextResponse.json({ id: result.booking.id, status: result.booking.status });
}
