import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as AuthService from "@/services/auth.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

// --- Auth Source of Truth ---
const ACCESS_TOKEN_MS = 50 * 60 * 1000; // 50 mins
const REFRESH_TOKEN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const setRefreshTokenCookie = (res: any, refreshToken: string) => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // 'lax' is required for OAuth redirects to work
    path: "/",
    maxAge: REFRESH_TOKEN_MS,
  });
};

const setAccessTokenCookie = (res: any, accessToken: string) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MS,
  });
};

const clearAuthCookies = (res: any) => {
  res.clearCookie("refresh_token", { path: "/" });
  res.clearCookie("access_token", { path: "/" });
};

export const authController = s.router(contract.auth, {
  register: async ({ body, req, res }: { body: any; req: any; res: any }) => {
    const ip = req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";

      const result = await AuthService.register(
        body.email,
        body.username,
        body.password,
        ip,
        userAgent,
      );

      setRefreshTokenCookie(res, result.data!.refreshToken);
      setAccessTokenCookie(res, result.data!.accessToken);

    return {
      status: 201,
      body: {
        user: result.data!.user! as any,
        token: result.data!.accessToken,
      },
    };
  },

  login: async ({ body, req, res }: { body: any; req: any; res: any }) => {
    const ip = req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";

      const result = await AuthService.login(
        body.email,
        body.password,
        ip,
        userAgent,
      );

      setRefreshTokenCookie(res, result.data!.refreshToken);
      setAccessTokenCookie(res, result.data!.accessToken);

    return {
      status: 200,
      body: {
        user: result.data!.user! as any,
        token: result.data!.accessToken,
      },
    };
  },

  refresh: async ({ req, res }: { req: any; res: any }) => {
    const refreshToken = (req as any).cookies?.refresh_token;
    if (!refreshToken) {
      throw new AppError(401, "No refresh token provided");
    }

    const result = await AuthService.refreshAccessToken(refreshToken).catch(err => {
      clearAuthCookies(res);
      if (err instanceof AppError) throw err;
      throw new AppError(401, "Token refresh failed");
    });

    setRefreshTokenCookie(res, result.data!.refreshToken);
    setAccessTokenCookie(res, result.data!.accessToken);

    return {
      status: 200,
      body: { token: result.data!.accessToken },
    };
  },

  logout: async ({ req, res }: { req: any; res: any }) => {
    const contextReq = req as unknown as RequestWithContext;
    const sessionId = contextReq.ctx?.decodedToken?.sessionId;

    if (!sessionId) {
      clearAuthCookies(res);
      return { status: 200, body: { success: true } };
    }

    await AuthService.logout(sessionId).catch(err => {
      clearAuthCookies(res);
      if (err instanceof AppError) throw err;
      throw new AppError(401, "Logout failed");
    });
    clearAuthCookies(res);

    return { status: 200, body: { success: true } };
  },

  logoutAll: async ({ req, res }: { req: any; res: any }) => {
    const contextReq = req as unknown as RequestWithContext;
    const userId = contextReq.ctx?.decodedToken?.id;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    const result = await AuthService.logoutAll(userId).catch(err => {
      clearAuthCookies(res);
      if (err instanceof AppError) throw err;
      throw new AppError(401, "Logout all failed");
    });
    
    clearAuthCookies(res);

    return {
      status: 200,
      body: {
        success: result.data!.success,
        sessionsRevoked: result.data!.sessionsRevoked,
      },
    };
  },

  sessions: async ({ req }: { req: any }) => {
    const contextReq = req as unknown as RequestWithContext;
    const userId = contextReq.ctx?.decodedToken?.id;

    if (!userId) {
      throw new AppError(401, "Not authenticated");
    }

    const sessions = await AuthService.getActiveSessions(userId);

    return {
      status: 200,
      body: { sessions: sessions.data as any },
    };
  },

  login42: async () => {
    const { url } = AuthService.getFortyTwoAuthUrl();
    return {
      status: 200,
      body: { url },
    };
  },

  callback42: async ({ query, req, res }: { query: any; req: any; res: any }) => {
    const ip = req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = await AuthService.handleFortyTwoCallback(query.code, ip, userAgent);

    if (result.type === "login") {
      setRefreshTokenCookie(res, result.data.refreshToken);
      setAccessTokenCookie(res, result.data.accessToken);
      
      // Force the browser redirect via strict HTTP headers
      res.setHeader("Location", `${process.env.FRONTEND_URL || "https://localhost:8080"}/profile?oauth_success=true`);
      return { status: 302, body: "" as any };
    }

    if (result.type === "pending_consent") {
      // Force the browser redirect via strict HTTP headers
      res.setHeader("Location", `${process.env.FRONTEND_URL || "https://localhost:8080"}/auth/consent?token=${result.pendingToken}&username=${result.profile.username}`);
      return { status: 302, body: "" as any };
    }

    throw new AppError(401, "Authentication failed");
  },

  confirm42: async ({ body, req, res }: { body: any; req: any; res: any }) => {
    const ip = req.ip || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "Unknown";

    const result = await AuthService.confirmFortyTwoRegistration(
      body.pendingToken,
      body.consent,
      ip,
      userAgent
    );

    setRefreshTokenCookie(res, result.data!.refreshToken);
    setAccessTokenCookie(res, result.data!.accessToken);

    return {
      status: 201,
      body: {
        user: result.data!.user as any,
        token: result.data!.accessToken,
      },
    };
  },
});
