/* -------------------------------------------------------------------------- */
/*                             RATE LIMIT TYPES                                */
/* -------------------------------------------------------------------------- */

export type Window = "second" | "minute" | "hour" | "day" | number;

export type RateLimitOptions = {
  /** Timeframe or time in milliseconds */
  window: Window;
  /** Max requests within the given window */
  max: number;
};

/* -------------------------------------------------------------------------- */
/*                                SIMPLIFIED LIMITS                             */
/* -------------------------------------------------------------------------- */

export const limits = {
  defaultRateLimit: {
    window: "minute",
    max: 60,
  },

  adminLimit: {
    window: 5000,
    max: 1,
  },

  // Tournament routing
  tournamentsGet: {
    window: "hour",
    max: 200,
  },

  tournamentsCreate: {
    window: "hour",
    max: 20,
  },

  tournamentsUpdate: {
    window: "hour",
    max: 50,
  },

  tournamentsDelete: {
    window: "hour",
    max: 10,
  },

  // Matches routing
  matchesGet: {
    window: "hour",
    max: 500,
  },

  matchesSubmitResult: {
    window: "hour",
    max: 100,
  },

  // Users routing
  userSignup: {
    window: "day",
    max: 5,
  },

  userProfileUpdate: {
    window: "hour",
    max: 50,
  },

  userDelete: {
    window: "day",
    max: 3,
  },
} satisfies Record<string, RateLimitOptions>;

/* -------------------------------------------------------------------------- */
/*                             TYPE HELPERS                                     */
/* -------------------------------------------------------------------------- */

export type RateLimiterId = keyof typeof limits;

export type RateLimitIds = {
  /** Rate limiter options for normal requests */
  normal: RateLimiterId;
  /** Optional future rate limiter for special requests */
  special?: RateLimiterId;
};

/* -------------------------------------------------------------------------- */
/*                            GET RATE LIMIT FUNCTION                          */
/* -------------------------------------------------------------------------- */

export function getLimits(limit: RateLimiterId | RateLimitIds): {
  limiter: RateLimitOptions;
  specialLimiter?: RateLimitOptions;
} {
  const isSpecialLimiter = typeof limit === "object";
  const limiter = isSpecialLimiter ? limit.normal : limit;
  const specialLimiter = isSpecialLimiter && limit.special ? limits[limit.special] : undefined;

  return {
    limiter: limits[limiter],
    specialLimiter,
  };
}
