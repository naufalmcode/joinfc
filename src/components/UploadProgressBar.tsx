"use client";

import type { UploadProgress } from "@/lib/upload";

interface Props {
  progress: UploadProgress & { current?: number; totalFiles?: number };
}

export default function UploadProgressBar({ progress }: Props) {
  const label =
    progress.phase === "processing"
      ? "Memproses gambar..."
      : progress.phase === "uploading"
        ? progress.totalFiles && progress.totalFiles > 1
          ? `Mengupload ${progress.current}/${progress.totalFiles}... ${progress.percent}%`
          : `Mengupload... ${progress.percent}%`
        : "Selesai!";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>{progress.percent}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${progress.phase === "done" ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}
