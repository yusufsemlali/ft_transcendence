/**
 * BFF (Backend-for-Frontend) Proxy Route Handler
 * 
 * All client-side API calls go through this catch-all route instead of
 * directly to the backend. This prevents the browser from seeing 4xx/5xx
 * responses in the network layer, which would print red errors in the console.
 *
 * Flow: Browser → /bff/* → Next.js server → Backend (http://ft_backend:3000/api/*)
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_BACKEND_API_URL || "http://ft_backend:3000/api";

// Headers that should NOT be forwarded to/from the backend
const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "transfer-encoding",
    "te",
    "trailer",
    "upgrade",
    "proxy-authorization",
    "proxy-authenticate",
]);

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const { path } = await params;
    const targetPath = path.join("/");
    const url = new URL(request.url);
    const queryString = url.search; // preserves ?foo=bar&baz=qux

    const backendUrl = `${BACKEND_URL}/${targetPath}${queryString}`;

    // Build headers to forward
    const forwardHeaders = new Headers();
    request.headers.forEach((value, key) => {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && key.toLowerCase() !== "host") {
            forwardHeaders.set(key, value);
        }
    });

    // Forward cookies from the browser request
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
        forwardHeaders.set("cookie", cookieHeader);
    }

    try {
        const backendResponse = await fetch(backendUrl, {
            method: request.method,
            headers: forwardHeaders,
            body: request.method !== "GET" && request.method !== "HEAD"
                ? request.body
                : undefined,
            // @ts-expect-error - Next.js fetch extension
            duplex: "half",
        });

        // Build the response headers
        const responseHeaders = new Headers();
        backendResponse.headers.forEach((value, key) => {
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
                responseHeaders.append(key, value);
            }
        });

        // The key trick: ALWAYS return 200 to the browser.
        // The real status is sent via a custom header so the ts-rest adapter
        // can reconstruct the correct status for application logic.
        responseHeaders.set("X-BFF-Status", String(backendResponse.status));

        // Use backendResponse.body directly to support streaming (SSE)
        return new NextResponse(backendResponse.body, {
            status: 200,
            headers: responseHeaders,
        });
    } catch {
        // Backend is unreachable — still return 200 with error status in header
        const headers = new Headers({
            "Content-Type": "application/json",
            "X-BFF-Status": "502",
        });
        return new NextResponse(
            JSON.stringify({ message: "Backend service unavailable" }),
            { status: 200, headers },
        );
    }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
