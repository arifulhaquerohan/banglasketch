"use client";

import { useState, useRef, DragEvent } from "react";
import { FiUpload, FiX } from "react-icons/fi";
import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary";

interface CloudinaryUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  multiple?: boolean;
  label?: string;
}

export function CloudinaryUpload({ value, onChange, folder = "general", label = "Upload Image" }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState<{ folder: string; bytes?: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInProgress = useRef(false);

  const handleUpload = async (file: File) => {
    if (uploadInProgress.current) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      setError("Select a JPG, PNG, WebP or AVIF image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be 10MB or smaller.");
      return;
    }

    uploadInProgress.current = true;
    setUploading(true);
    setError(null);
    setStorageInfo(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        signal: AbortSignal.timeout(65_000),
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || "Upload failed");
      const data = { secure_url: result.data?.url };
      if (typeof data.secure_url !== "string") throw new Error("Upload did not return an image URL");
      setStorageInfo({
        folder: typeof result.data?.folder === "string" ? result.data.folder : "banglasketch/media",
        bytes: typeof result.data?.bytes === "number" ? result.data.bytes : undefined,
      });

      // Automatically optimize URL with f_auto, q_auto:good, and max width 1920
      const optimizedUrl = getOptimizedCloudinaryUrl(data.secure_url, {
        width: 1920,
        quality: "auto:good",
        crop: "limit",
      });
      onChange(optimizedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      uploadInProgress.current = false;
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  };

  return (
    <div>
      {label && <label className="block text-xs font-semibold text-[#586348] uppercase tracking-wider mb-2">{label}</label>}
      {value ? (
        <div className="relative group rounded-2xl overflow-hidden border border-[#DED5C7] shadow-2xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-[#242824]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-[#586348] text-white rounded-xl font-semibold text-xs hover:bg-[#444D37] transition-colors shadow-xs"
            >
              Replace
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => { onChange(""); setStorageInfo(null); }}
              className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold text-xs hover:bg-red-700 transition-colors shadow-xs"
            >
              <FiX size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-[#586348] bg-[#EDF1EA]"
              : "border-[#DED5C7] hover:border-[#586348] hover:bg-[#F5F2EB]/60 bg-white"
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 border-3 border-[#586348] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-[#5A625A]">Uploading...</p>
            </div>
          ) : (
            <>
              <FiUpload className="mx-auto text-[#586348] mb-2.5" size={28} />
              <p className="text-xs font-semibold text-[#242824] mb-1">Drop image or click to upload</p>
              <p className="text-[11px] text-[#737D73]">PNG, JPG, WebP up to 10MB</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        disabled={uploading}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) handleUpload(file);
        }}
      />
      {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
      {storageInfo && !error && (
        <div role="status" className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-800">
          <span className="font-semibold">Saved securely.</span>{" "}
          Hidden photo metadata was removed and the upload was recorded in the admin audit log.
          <span className="mt-0.5 block text-emerald-700/80">
            Storage: {storageInfo.folder}
            {storageInfo.bytes ? ` · ${(storageInfo.bytes / 1024 / 1024).toFixed(2)} MB` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
