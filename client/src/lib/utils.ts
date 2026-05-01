import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Transforms /manus-storage/ URLs to /api/storage-proxy/ URLs.
 * On the deployed version, the CDN intercepts /manus-storage/ paths and returns
 * a 307 redirect to CloudFront, which iOS Safari doesn't handle correctly for <img> tags.
 * By routing through /api/storage-proxy/, the request reaches our Express server which
 * pipes the file through directly (no redirect).
 */
export function storageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/manus-storage/")) {
    return url.replace("/manus-storage/", "/api/storage-proxy/");
  }
  return url;
}
