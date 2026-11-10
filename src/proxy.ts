import { NextRequest, NextResponse } from "next/server";

// ponytail: cookie-presence check; upgrade to @supabase/ssr JWT signature verification when multi-school RBAC is added.
export function proxy(req: NextRequest) {
  if (!req.cookies.get("zonasi_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
