import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 session-refresh entrypoint ("Proxy" convention).
 *
 * Runs before rendering on every matched request and refreshes the Supabase
 * auth cookies. On Next.js 15 or earlier, move this exact body into
 * middleware.ts instead (same matcher, `export async function middleware`).
 */
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Public asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
