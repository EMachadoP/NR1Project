import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/server/supabase/middleware";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  return response ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
