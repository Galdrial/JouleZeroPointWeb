/**
 * imageResolver.ts: Asset Normalization Protocol
 * Ensures that news imagery URLs are correctly mapped to the Backend API
 * logic in production environments.
 */

export function resolveNewsImage(url: string | null | undefined): string {
  if (!url) return '';

  // 1. Logic for Remote Artifacts: Return as-is if it includes a protocol.
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // 2. Logic for Matrix Uploads: Redirect to the Backend Static Server
  // If the path starts with /news/ or news/ it means it's an uploaded asset on the backend.
  if (url.startsWith('/news/') || url.startsWith('news/')) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    // Typically apiUrl is something like https://backend.com/api/v1
    // We want the base: https://backend.com
    try {
      const urlObj = new URL(apiUrl, window.location.origin);
      // Construct the base: origin + handle relative cases
      return `${urlObj.origin}${normalizedPath}`;
    } catch {
      // Fallback if VITE_API_URL is missing or malformed
      return url;
    }
  }

  // 3. Logic for Local Frontend Assets: Return path as-is (browser resolves relative to frontend)
  return url;
}
