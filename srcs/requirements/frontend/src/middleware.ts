import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/settings", "/profile", "/tournaments/create"];
const authRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest) {
    let token = request.cookies.get("token")?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;
    const { pathname } = request.nextUrl;

    let newTokenToSet: string | null = null;

    if (!token && refreshToken) {
        try {
            const refreshRes = await fetch(`${process.env.INTERNAL_BACKEND_API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `refresh_token=${refreshToken}`
                },
            });

            if (refreshRes.ok) {
                const data = await refreshRes.json();
                token = data.token; 
                newTokenToSet = data.token; 
            }
        } catch (error) {
            console.error("Middleware Refresh Failed:", error);
        }
    }

    const requestHeaders = new Headers(request.headers);
    if (newTokenToSet) {
        requestHeaders.set('Cookie', `token=${newTokenToSet}; refresh_token=${refreshToken}`);
    }

    let response: NextResponse;

    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
        const url = new URL("/login", request.url);
        url.searchParams.set("callbackUrl", pathname);
        response = NextResponse.redirect(url);
    } else if (token && authRoutes.some(route => pathname.startsWith(route))) {
        response = NextResponse.redirect(new URL("/", request.url));
    } else {
        response = NextResponse.next({
            request: { headers: requestHeaders }
        });
    }

    if (newTokenToSet) {
        response.cookies.set('token', newTokenToSet, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15, // 15 mins
        });
    }

    return response;
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
