import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/settings", "/profile", "/tournaments/create"];

const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
        const url = new URL("/login", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    if (token && authRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(new URL("/", request.url));
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
