import { v4 as uuidv4 } from "uuid";

export function getErrorMessage(error: unknown): string | undefined {
  let message = "";

  if (error instanceof Error) {
    message = error.message;
  } else if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    (typeof error.message === "string" || typeof error.message === "number")
  ) {
    message = `${error.message}`;
  } else if (typeof error === "string") {
    message = error;
  } else if (typeof error === "number") {
    message = `${error}`;
  }

  if (message === "") {
    return undefined;
  }

  return message;
}

export default class AppError extends Error {
  public readonly status: number;
  public readonly errorId: string;
  public readonly uid?: string;

  constructor(status: number, message?: string, stack?: string, uid?: string) {
    super(message);
    this.status = status ?? 500;
    this.errorId = uuidv4();
    this.stack = stack;
    this.uid = uid;

    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
      this.message =
        (stack ?? "")
          ? String(message) + "\nStack: " + String(stack)
          : String(message);
    } else {
      if ((this.stack ?? "") && this.status >= 500) {
        this.stack = this.message + "\n" + this.stack;
        this.message = "Internal Server Error " + this.errorId;
      } else {
        this.message = String(message);
      }
    }
  }
}
