import { toast } from "@/components/ui/sonner";

type ZodLikeIssue = {
  path?: (string | number)[];
  message?: string;
};

type ApiErrorBody = {
  message?: string;
  errors?: ZodLikeIssue[];
};

function pathLabel(path: (string | number)[] | undefined): string {
  if (!path?.length) return "";
  return path.map(String).join(".");
}

function issueLine(issue: ZodLikeIssue): string {
  const msg = typeof issue.message === "string" && issue.message.trim()
    ? issue.message
    : "Invalid value";
  const p = pathLabel(issue.path);
  return p ? `${p}: ${msg}` : msg;
}

/** One-line summary for Error() or labels (e.g. invite history). */
export function formatApiErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as ApiErrorBody;
  if (Array.isArray(b.errors) && b.errors.length > 0) {
    return b.errors.map(issueLine).join("; ");
  }
  if (typeof b.message === "string" && b.message.trim()) return b.message;
  return fallback;
}

/**
 * Toast API failures with field-level detail when the server returns Zod issues
 * (`{ message: "Validation failed", errors: [...] }`).
 */
export function toastApiError(body: unknown, fallback: string): void {
  if (!body || typeof body !== "object") {
    toast.error(fallback);
    return;
  }
  const b = body as ApiErrorBody;
  if (Array.isArray(b.errors) && b.errors.length > 0) {
    const lines = b.errors.map(issueLine);
    if (b.errors.length === 1) {
      toast.error(lines[0]!, { duration: 6000 });
      return;
    }
    toast.error(`${b.errors.length} validation issues`, {
      description: lines.join("\n"),
      duration: 8000,
    });
    return;
  }
  toast.error(
    typeof b.message === "string" && b.message.trim() ? b.message : fallback,
  );
}
