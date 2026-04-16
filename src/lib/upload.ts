// Shared upload utility with progress tracking and configurable quality

export type ImageQuality = "low" | "original" | "hd" | "uhd" | "2k" | "4k";

export const IMAGE_QUALITY_OPTIONS: { value: ImageQuality; label: string; desc: string }[] = [
  { value: "low", label: "Low", desc: "640×480" },
  { value: "original", label: "Original", desc: "" },
  { value: "hd", label: "HD", desc: "1280×720" },
  { value: "uhd", label: "UHD", desc: "1920×1080" },
  { value: "2k", label: "2K", desc: "2560×1440" },
  { value: "4k", label: "4K", desc: "3840×2160" },
];

const QUALITY_RESOLUTIONS: Record<ImageQuality, { w: number; h: number } | null> = {
  low: { w: 640, h: 480 },
  original: null,
  hd: { w: 1280, h: 720 },
  uhd: { w: 1920, h: 1080 },
  "2k": { w: 2560, h: 1440 },
  "4k": { w: 3840, h: 2160 },
};

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  phase: "processing" | "uploading" | "done";
}

/**
 * Resize image to target resolution using canvas.
 */
function processImage(file: File, quality: ImageQuality): Promise<File> {
  return new Promise((resolve) => {
    if (file.type === "image/svg+xml" || quality === "original") {
      resolve(file);
      return;
    }

    const target = QUALITY_RESOLUTIONS[quality];
    if (!target) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;

      // For "low" quality, downscale if larger. For others, upscale if smaller.
      const isDownscale = quality === "low";
      if (isDownscale && w <= target.w && h <= target.h) {
        resolve(file);
        return;
      }
      if (!isDownscale && w >= target.w && h >= target.h) {
        resolve(file);
        return;
      }

      const scale = isDownscale
        ? Math.min(target.w / w, target.h / h)
        : Math.max(target.w / w, target.h / h);
      const newW = Math.round(w * scale);
      const newH = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newW, newH);

      const outputType = file.type === "image/png" ? "image/png" : "image/webp";
      const outputQuality = outputType === "image/png" ? undefined : 0.92;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const ext = outputType === "image/png" ? "png" : "webp";
          const name = file.name.replace(/\.[^.]+$/, `.${ext}`);
          resolve(new File([blob], name, { type: outputType }));
        },
        outputType,
        outputQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Upload a single file with progress tracking and quality processing.
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  quality: ImageQuality = "original"
): Promise<string> {
  onProgress?.({ loaded: 0, total: 0, percent: 0, phase: "processing" });

  let processedFile: File;
  try {
    processedFile = await processImage(file, quality);
  } catch {
    processedFile = file;
  }

  onProgress?.({ loaded: 0, total: processedFile.size, percent: 10, phase: "uploading" });

  const formData = new FormData();
  formData.append("file", processedFile);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `Upload failed (${res.status})`;
    try { const j = JSON.parse(text); if (j.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || "Upload failed");
  }

  onProgress?.({ loaded: 1, total: 1, percent: 100, phase: "done" });
  return data.data.url;
}

/**
 * Upload multiple files with aggregate progress tracking.
 */
export async function uploadFiles(
  files: File[],
  onProgress?: (progress: UploadProgress & { current: number; totalFiles: number }) => void,
  quality: ImageQuality = "original"
): Promise<string[]> {
  const urls: string[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const url = await uploadFile(files[i], (p) => {
      const fileProgress = p.phase === "done" ? 1 : p.phase === "processing" ? 0 : (p.percent / 100);
      const overallPercent = Math.round(((i + fileProgress) / totalFiles) * 100);
      onProgress?.({
        ...p,
        percent: overallPercent,
        current: i + 1,
        totalFiles,
      });
    }, quality);
    urls.push(url);
  }

  return urls;
}
