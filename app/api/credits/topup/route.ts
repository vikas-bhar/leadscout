import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Direct free credit top-ups are disabled. All credit packages require verified payment through checkout.",
    },
    { status: 403 }
  );
}
