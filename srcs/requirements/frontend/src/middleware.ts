import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const adminRoutes = ["/admin"];

const protectedRoutes = ["/settings", "/profile", "/tournaments/create", "/dashboard"];

const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
    // 1. Check for both access and refresh cookies
    const hasAccessToken = request.cookies.has("access_token");
    const hasRefreshToken = request.cookies.has("refresh_token");
    const isAuthenticated = hasAccessToken || hasRefreshToken;

    const { pathname } = request.nextUrl;

    if (!isAuthenticated && protectedRoutes.some(route => pathname.startsWith(route))) {
        const url = new URL("/login", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (isAuthenticated && adminRoutes.some(route => pathname.startsWith(route))) {
        const user = request.auth?.user;
        if (user?.role !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
