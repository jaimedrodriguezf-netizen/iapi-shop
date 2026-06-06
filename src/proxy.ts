import type { NextRequest } from "next/server";

import { isProtectedAppRoute } from "@/lib/auth/permissions";
import { updateSession } from "@/lib/supabase/middleware";

export default async function proxy(request: NextRequest) {
  if (!isProtectedAppRoute(request.nextUrl.pathname)) {
    return updateSession(request);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
