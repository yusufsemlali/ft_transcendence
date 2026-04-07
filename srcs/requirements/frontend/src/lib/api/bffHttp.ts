import type { AxiosResponse } from "axios";

/** Real HTTP status when the response came through `/bff/*` (body is always 200). */
export function getBffHttpStatus(response: AxiosResponse): number {
  const h = response.headers["x-bff-status"];
  if (h === undefined || h === "") return response.status;
  return parseInt(String(h), 10);
}
