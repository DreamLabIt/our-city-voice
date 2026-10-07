import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/session-cookies";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;

    if (pathname.startsWith("/dashboard")) {
        if (!accessToken) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};