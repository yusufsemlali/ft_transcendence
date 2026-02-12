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

import { getIdToken, refreshToken } from "../auth-client";

let toastShownThisSession = false;

export let lastSeenServerCompatibility: number | undefined;

function timeoutSignal(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new Error("request timed out")), ms);
  return ctrl.signal;
}


function buildApi(
  timeout: number,
  baseUrl: string,
): (
  args: ApiFetcherArgs,
) => Promise<{ status: number; body: unknown; headers: Headers }> {
  return async (request: ApiFetcherArgs) => {
    // Helper to execute the core fetch logic
    const executeFetch = async (
      overrideToken?: string,
    ): Promise<{ status: number; body: unknown; headers: Headers }> => {
      try {
        const token = overrideToken || (await getIdToken());
        const isPublicEndpoint = request.path.includes("/auth/login") || request.path.includes("/auth/register");

        if (token !== null && !isPublicEndpoint) {
          request.headers["Authorization"] = `Bearer ${token}`;
        }

        const usePolyfill = AbortSignal?.timeout === undefined;

        request.fetchOptions = {
          ...request.fetchOptions,
          signal: usePolyfill
            ? timeoutSignal(timeout)
            : AbortSignal.timeout(timeout),
        };

        const response = await tsRestFetchApi(request);
        return response;
      } catch (e: Error | unknown) {
        let message = "Unknown error";

        if (e instanceof Error) {
          if (e.message.includes("timed out")) {
            message = "request took too long to complete";
            return {
              status: 408,
              body: { message },
              headers: new Headers(),
            };
          } else {
            message = e.message;
          }
        }

        return {
          status: 500,
          body: { message },
          headers: new Headers(),
        };
      }
    };

    // 1. Initial Request
    let response = await executeFetch();

    // 2. Log Errors
    if (response.status >= 400 && response.status !== 401 && response.status !== 404) {
      console.error(`${request.method} ${request.path} failed`, {
        status: response.status,
        ...(response.body as object),
      });
    }

    // 3. Handle Compatibility Checks
    const compatibilityCheckHeader = response.headers.get(
      COMPATIBILITY_CHECK_HEADER,
    );

    if (compatibilityCheckHeader !== null) {
      lastSeenServerCompatibility = parseInt(compatibilityCheckHeader);

      if (!toastShownThisSession) {
        const backendCheck = parseInt(compatibilityCheckHeader);
        if (backendCheck !== COMPATIBILITY_CHECK) {
          const message =
            backendCheck > COMPATIBILITY_CHECK
              ? `Looks like the client and server versions are mismatched (backend is newer). Please refresh the page.`
              : `Looks like our devs didn't deploy the new server version correctly. If this message persists contact support.`;
          toast.error(message);
          toastShownThisSession = true;
        }
      }
    }

    // 4. Handle 401 Unauthorized (Auto-Refresh)
    // Don't try to refresh if the 401 came from the login endpoint itself (wrong credentials)
    const isLoginEndpoint = request.path.includes("/auth/login");

    if (response.status === 401 && typeof window !== "undefined" && !isLoginEndpoint) {
      const refreshed = await refreshToken(baseUrl);
      if (refreshed) {
        // Retry the request with the new token
        const newToken = localStorage.getItem("token");
        if (newToken) {
          response = await executeFetch(newToken);
        }
      } else {
        // Refresh failed, clear token and notify app
        localStorage.removeItem("token");
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
