import { NextResponse } from "next/server";
import { getSettings, updateSetting } from "@/lib/googleSheets";
import { isOwnerAuthed, unauthorizedJson } from "@/lib/requireAdminAuth";

const DEFAULT_PRICE = 150;

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    enabled: settings.house_call_enabled === "TRUE",
    price:   Number(settings.house_call_price ?? DEFAULT_PRICE) || DEFAULT_PRICE,
  });
}

export async function POST(request) {
  if (!isOwnerAuthed(request)) return unauthorizedJson();

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { enabled, price } = body;

  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean." }, { status: 400 });
  }
  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return NextResponse.json({ error: "price must be a non-negative number." }, { status: 400 });
  }

  await Promise.all([
    updateSetting("house_call_enabled", enabled ? "TRUE" : "FALSE"),
    updateSetting("house_call_price",   String(parsedPrice)),
  ]);

  return NextResponse.json({ enabled, price: parsedPrice });
}
