"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "confirm" | "alert";
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Batal",
  type = "confirm",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape" && onCancel) onCancel();
      };
      window.addEventListener("keydown", handleKey);
      return () => window.removeEventListener("keydown", handleKey);
    }
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current && onCancel) onCancel();
      }}
    >
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {title && <h3 className="text-lg font-bold text-white mb-2">{title}</h3>}
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {type === "confirm" && onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition text-sm"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
