// Shared upload utility with progress tracking and UHD upscaling

const UHD_MIN_WIDTH = 3840;
const UHD_MIN_HEIGHT = 2160;

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  phase: "processing" | "uploading" | "done";
}

/**
 * Upscale image to UHD resolution if smaller, using canvas.
 * Returns a new File with the upscaled image.
 */
function upscaleImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // Skip non-raster images (SVG)
    if (file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;

      // If already UHD or larger, return original
      if (w >= UHD_MIN_WIDTH || h >= UHD_MIN_HEIGHT) {
        resolve(file);
        return;
      }

      // Calculate scale to reach UHD on the longest side
      const scale = Math.max(UHD_MIN_WIDTH / w, UHD_MIN_HEIGHT / h);
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

      // Use high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, newW, newH);

      // Convert to blob — use webp for better quality/size ratio, fallback to original type
      const outputType = file.type === "image/png" ? "image/png" : "image/webp";
      const quality = outputType === "image/png" ? undefined : 0.92;

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
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original on error
    };

    img.src = url;
  });
}

/**
 * Upload a single file with progress tracking and UHD upscaling.
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Phase 1: Processing (upscale)
  onProgress?.({ loaded: 0, total: 0, percent: 0, phase: "processing" });

  let processedFile: File;
  try {
    processedFile = await upscaleImage(file);
  } catch {
    processedFile = file;
  }

  // Phase 2: Uploading with fetch (always sends cookies for same-origin)
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
  onProgress?: (progress: UploadProgress & { current: number; totalFiles: number }) => void
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
    });
    urls.push(url);
  }

  return urls;
}
