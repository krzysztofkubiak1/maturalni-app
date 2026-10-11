import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/user";

/**
 * Szybkie przekierowanie na logowanie, gdy ktoś wchodzi po /panel bez ciasteczka sesji.
 * To tylko UX — sprawdza obecność ciasteczka, nie jego ważność.
 * Właściwą weryfikację robi komponent serwerowy strony /panel (getCurrentUser).
 *
 * W Next.js 16 ten plik nosi nazwę `proxy.ts` (dawniej `middleware.ts`).
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    const loginUrl = new URL("/logowanie", request.url);
    loginUrl.searchParams.set("po-zalogowaniu", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*"],
};
