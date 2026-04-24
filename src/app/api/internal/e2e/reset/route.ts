import { NextResponse } from "next/server";
import { isTestAuthEnabled } from "@/lib/auth/testAuth";
import { isE2EMockMode, resetE2EState } from "@/lib/supabase/e2e";

export async function POST() {
  if (!isTestAuthEnabled() || !isE2EMockMode()) {
    return NextResponse.json(
      {
        error: "Not found",
      },
      { status: 404 },
    );
  }

  resetE2EState();

  return new NextResponse(null, { status: 204 });
}
