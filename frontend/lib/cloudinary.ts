/**
 * Helper to generate optimized Cloudinary image URLs.
 * Automatically injects:
 * - f_auto: delivers WebP / AVIF depending on visitor's browser
 * - q_auto: eco / good / best compression without visual quality loss
 * - c_limit: maintains high resolution while constraining excessive pixel dimensions
 */
export function getOptimizedCloudinaryUrl(
  url: string | undefined | null,
  options?: {
    width?: number;
    height?: number;
    quality?: "auto" | "auto:best" | "auto:good" | "auto:eco" | number;
    crop?: "limit" | "fill" | "scale" | "thumb";
  }
): string {
  if (!url || typeof url !== "string") return "";

  // Only apply transformations to Cloudinary URLs
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) {
    return url;
  }

  const {
    width = 1920,
    quality = "auto:good",
    crop = "limit",
  } = options || {};

  // Construct transformation segment
  const transforms: string[] = ["f_auto", `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (crop) transforms.push(`c_${crop}`);

  const transformString = transforms.join(",");

  // Check if URL already has transformations
  const uploadIndex = url.indexOf("/image/upload/");
  if (uploadIndex === -1) return url;

  const prefix = url.substring(0, uploadIndex + "/image/upload/".length);
  const rest = url.substring(uploadIndex + "/image/upload/".length);

  // If already transformed, don't duplicate
  if (rest.startsWith("f_auto") || rest.startsWith("q_auto")) {
    return url;
  }

  return `${prefix}${transformString}/${rest}`;
}
