import axios, { AxiosProgressEvent } from "axios";
import { refreshToken } from "@/lib/api/auth-client";
import { getBffHttpStatus } from "@/lib/api/bffHttp";

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  headers?: Record<string, string>;
}

export interface UploadResult {
  id: string;
  url: string;
  originalName: string;
  sizeBytes: number;
  mimeType: string;
}

/**
 * Perform a file upload via axios to the BFF.
 * On expired access token (BFF `X-BFF-Status: 401`), refreshes the session and retries once
 * with a new FormData (same pattern as ts-rest, avoids reusing a consumed multipart body).
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const postOnce = () => {
    const formData = new FormData();
    formData.append("file", file);
    return axios.post("/bff/files/upload", formData, {
      headers: {
        ...options.headers,
      },
      withCredentials: true,
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && options.onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          options.onProgress(percentCompleted);
        }
      },
    });
  };

  let response = await postOnce();
  let bffStatus = getBffHttpStatus(response);

  if (bffStatus === 401) {
    const ok = await refreshToken();
    if (!ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
      throw new Error("Session expired");
    }
    response = await postOnce();
    bffStatus = getBffHttpStatus(response);
  }

  const success = bffStatus === 200 || bffStatus === 201;

  if (success && response.data?.data) {
    return response.data.data;
  }
  throw new Error(response.data?.message || "Upload failed");
}
