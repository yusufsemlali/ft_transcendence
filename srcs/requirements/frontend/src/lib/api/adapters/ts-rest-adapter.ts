import {
  AppRouter,
  initClient,
  tsRestFetchApi,
  type ApiFetcherArgs,
} from "@ts-rest/core";
import {
  COMPATIBILITY_CHECK,
  COMPATIBILITY_CHECK_HEADER,
} from "@ft-transcendence/contracts";
import { toast } from "@/components/ui/sonner";

import { refreshToken } from "../auth-client";

let toastShownThisSession = false;

export let lastSeenServerCompatibility: number | undefined;

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new Error("request timed out")), ms);
  return ctrl.signal;
}

function buildApi(
  timeout: number,
  _baseUrl: string,
): (
  args: ApiFetcherArgs,
) => Promise<{ status: number; body: unknown; headers: Headers }> {
  return async (request: ApiFetcherArgs) => {

    const executeFetch = async (): Promise<{ status: number; body: unknown; headers: Headers }> => {
      try {
        const usePolyfill = AbortSignal?.timeout === undefined;

        request.fetchOptions = {
          ...request.fetchOptions,
          credentials: "include", // Browser automatically handles cookies
          cache: "no-store",      // Prevent browser caching of dynamic data
          signal: usePolyfill
            ? timeoutSignal(timeout)
            : AbortSignal.timeout(timeout),
        };

        const result = await tsRestFetchApi(request);

        // BFF proxy always returns HTTP 200 to avoid browser console errors.
        // The real backend status is in the X-BFF-Status header.
        const bffStatus = result.headers.get("X-BFF-Status");
        if (bffStatus) {
          result.status = parseInt(bffStatus, 10);
        }

        return result;
      } catch (e: Error | unknown) {
        let message = "Unknown error";
        if (e instanceof Error) {
          if (e.message.includes("timed out")) {
            message = "request took too long to complete";
            return { status: 408, body: { message }, headers: new Headers() };
          }
          message = e.message;
        }
        return { status: 500, body: { message }, headers: new Headers() };
      }
    };

    // 1. Initial Request
    let response = await executeFetch();

    // 3. Handle Compatibility Checks
    const compatibilityCheckHeader = response.headers.get(COMPATIBILITY_CHECK_HEADER);
    if (compatibilityCheckHeader !== null) {
      lastSeenServerCompatibility = parseInt(compatibilityCheckHeader);
      if (!toastShownThisSession) {
        const backendCheck = parseInt(compatibilityCheckHeader);
        if (backendCheck !== COMPATIBILITY_CHECK) {
          const message = backendCheck > COMPATIBILITY_CHECK
            ? `Looks like the client and server versions are mismatched (backend is newer). Please refresh the page.`
            : `Looks like our devs didn't deploy the new server version correctly. If this message persists contact support.`;
          toast.error(message);
          toastShownThisSession = true;
        }
      }
    }

    // 4. Handle 401 Unauthorized (Auto-Refresh with Lock)
    const isPublicEndpoint = request.path.includes("/auth/login") || request.path.includes("/auth/register") || request.path.includes("/auth/refresh");

    if (response.status === 401 && typeof window !== "undefined" && !isPublicEndpoint) {
      const refreshed = await refreshToken();

      if (refreshed) {
        // The backend set a new cookie. Simply try the exact same request again.
        response = await executeFetch();
      } else {
        // Refresh failed (session truly dead). Notify app to kick user out.
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    return response;
  };
}

// oxlint-disable-next-line explicit-function-return-type
export function buildClient<T extends AppRouter>(
  contract: T,
  baseUrl: string,
  timeout: number = 10_000,
) {
  return initClient(contract, {
    baseUrl: baseUrl,
    jsonQuery: true,
    api: buildApi(timeout, baseUrl),
    baseHeaders: {
      Accept: "application/json",
      "X-Client-Version": process.env.NEXT_PUBLIC_CLIENT_VERSION || "1.0.0",
    },
  });
}
