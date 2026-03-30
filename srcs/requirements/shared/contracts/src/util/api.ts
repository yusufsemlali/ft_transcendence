import { z, ZodSchema } from "zod";
import { RateLimitIds, RateLimiterId } from "../rate-limit";
import { RequireConfiguration } from "../require-configuration";

export type OpenApiTag =
  | "configs"
  | "presets"
  | "api-keys"
  | "admin"
  | "tournaments"
  | "public"
  | "leaderboards"
  | "results"
  | "configuration"
  | "development"
  | "users"
  | "matches"
  | "webhooks"
  | "connections";

export type PermissionId =
  | "matchMod"
  | "canReport"
  | "canManageApiKeys"
  | "admin";

export type EndpointMetadata = {
  authenticationOptions?: RequestAuthenticationOptions;
  openApiTags?: OpenApiTag | OpenApiTag[];
  rateLimit?: RateLimiterId | RateLimitIds;
  requirePermission?: PermissionId | PermissionId[];
  requireConfiguration?: RequireConfiguration | RequireConfiguration[];
};

export function meta(metadata: EndpointMetadata): EndpointMetadata {
  return metadata;
}

export type RequestAuthenticationOptions = {
  isPublic?: boolean;
  acceptApiKeys?: boolean;
  requireFreshToken?: boolean;
  noCache?: boolean;
  isPublicOnDev?: boolean;
  isGithubWebhook?: boolean;
};

/* -------------------------------------------------------------------------- */
/*                                   SCHEMAS                                  */
/* -------------------------------------------------------------------------- */

export const ApiResponseSchema = z.object({
  message: z.string(),
});
export type ApiResponseType = z.infer<typeof ApiResponseSchema>;

export const ApiValidationErrorSchema = ApiResponseSchema.extend({
  validationErrors: z.array(z.string()),
});
export type ApiValidationError = z.infer<typeof ApiValidationErrorSchema>;

export const ApiClientError = ApiResponseSchema;
export type ApiClientErrorType = z.infer<typeof ApiClientError>;

export const ApiServerError = ApiClientError.extend({
  errorId: z.string(),
  uid: z.string().optional(),
});
export type ApiServerErrorType = z.infer<typeof ApiServerError>;

/* -------------------------------------------------------------------------- */
/*                              RESPONSE BUILDERS                             */
/* -------------------------------------------------------------------------- */

export function responseWithNullableData<T extends ZodSchema>(
  dataSchema: T,
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof ApiResponseSchema.shape,
    {
      data: z.ZodNullable<T>;
    }
  >
> {
  return ApiResponseSchema.extend({
    data: dataSchema.nullable(),
  });
}

export function responseWithData<T extends ZodSchema>(
  dataSchema: T,
): z.ZodObject<
  z.objectUtil.extendShape<
    typeof ApiResponseSchema.shape,
    {
      data: T;
    }
  >
> {
  return ApiResponseSchema.extend({
    data: dataSchema,
  });
}

/* -------------------------------------------------------------------------- */
/*                             COMMON API RESPONSES                           */
/* -------------------------------------------------------------------------- */

export const CommonResponses = {
  400: ApiClientError.describe("Generic client error"),
  401: ApiClientError.describe(
    "Authentication required but not provided or invalid",
  ),
  403: ApiClientError.describe("Operation not permitted"),
  422: ApiValidationErrorSchema.describe("Request validation failed"),
  429: ApiClientError.describe("Rate limit exceeded"),
  470: ApiClientError.describe("Invalid API key"),
  471: ApiClientError.describe("API key is inactive"),
  472: ApiClientError.describe("API key is malformed"),
  479: ApiClientError.describe("API key rate limit exceeded"),
  500: ApiServerError.describe("Generic server error"),
  503: ApiServerError.describe(
    "Endpoint disabled or server is under maintenance",
  ),
};

export type CommonResponsesType =
  | {
      status: 400 | 401 | 403 | 429 | 470 | 471 | 472 | 479;
      body: ApiClientErrorType;
    }
  | {
      status: 422;
      body: ApiValidationError;
    }
  | {
      status: 500 | 503;
      body: ApiServerErrorType;
    };


