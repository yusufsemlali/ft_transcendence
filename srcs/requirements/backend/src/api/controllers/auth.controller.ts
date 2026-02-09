import { initServer } from "@ts-rest/express";
import { contract } from "@ft-transcendence/contracts";
import * as AuthService from "@/services/auth.service";
import { RequestWithContext } from "@/api/types";
import AppError from "@/utils/error";

const s = initServer();

const setRefreshTokenCookie = (res: any, refreshToken: string) => {
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const clearRefreshTokenCookie = (res: any) => {
  res.clearCookie("refresh_token", { path: "/" });
};

export const authController = s.router(contract.auth, {
  register: async ({ body, req, res }) => {
    try {
      const ip = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Unknown";

      const result = await AuthService.register(
        body.email,
        body.username,
        body.password,
        ip,
        userAgent,
      );

      setRefreshTokenCookie(res, result.refreshToken);

      return {
        status: 201,
        body: {
          user: result.user! as any,
          token: result.accessToken,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          status: error.status as 400 | 409,
          body: { message: error.message },
        };
      }
      return { status: 400, body: { message: "Failed to register user" } };
    }
  },

  login: async ({ body, req, res }) => {
    try {
      const ip = req.ip || "127.0.0.1";
      const userAgent = req.headers["user-agent"] || "Unknown";

      const result = await AuthService.login(
        body.email,
        body.password,
        ip,
        userAgent,
      );

      setRefreshTokenCookie(res, result.refreshToken);

      return {
        status: 200,
        body: {
          user: result.user! as any,
          token: result.accessToken,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          status: error.status as 401,
          body: { message: error.message },
        };
      }
      return { status: 401, body: { message: "Invalid credentials" } };
    }
  },

  refresh: async ({ req, res }) => {
    try {
      const refreshToken = (req as any).cookies?.refresh_token;
      if (!refreshToken) {
        return { status: 401, body: { message: "No refresh token provided" } };
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      setRefreshTokenCookie(res, result.refreshToken);

      return {
        status: 200,
        body: { token: result.accessToken },
      };
    } catch (error) {
      if (error instanceof AppError) {
        clearRefreshTokenCookie(res);
        return { status: 401, body: { message: error.message } };
      }
      clearRefreshTokenCookie(res);
      return { status: 401, body: { message: "Token refresh failed" } };
    }
  },

  logout: async ({ req, res }) => {
    try {
      const contextReq = req as unknown as RequestWithContext;
      const sessionId = contextReq.ctx?.decodedToken?.sessionId;

      if (!sessionId) {
        clearRefreshTokenCookie(res);
        return { status: 200, body: { success: true } };
      }

      await AuthService.logout(sessionId);
      clearRefreshTokenCookie(res);

      return { status: 200, body: { success: true } };
    } catch (error) {
      clearRefreshTokenCookie(res);
      if (error instanceof AppError) {
        return { status: 401, body: { message: error.message } };
      }
      return { status: 401, body: { message: "Logout failed" } };
    }
  },

  logoutAll: async ({ req, res }) => {
    try {
      const contextReq = req as unknown as RequestWithContext;
      const userId = contextReq.ctx?.decodedToken?.id;

      if (!userId) {
        return { status: 401, body: { message: "Not authenticated" } };
      }

      const result = await AuthService.logoutAll(userId);
      clearRefreshTokenCookie(res);

      return {
        status: 200,
        body: {
          success: result.success,
          sessionsRevoked: result.sessionsRevoked,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        return { status: 401, body: { message: error.message } };
      }
      return { status: 401, body: { message: "Logout all failed" } };
    }
  },

  sessions: async ({ req }) => {
    try {
      const contextReq = req as unknown as RequestWithContext;
      const userId = contextReq.ctx?.decodedToken?.id;

      if (!userId) {
        return { status: 401, body: { message: "Not authenticated" } };
      }

      const sessions = await AuthService.getActiveSessions(userId);

      return {
        status: 200,
        body: { sessions: sessions as any },
      };
    } catch (error) {
      if (error instanceof AppError) {
        return { status: 401, body: { message: error.message } };
      }
      return { status: 401, body: { message: "Failed to fetch sessions" } };
    }
  },
});
