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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Images must be 10MB or smaller.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. First attempt a secure, signed upload via the admin proxy if available
      let signData: { signature?: string; timestamp?: number; apiKey?: string; cloudName?: string; folder?: string; allowedFormats?: string[]; maxBytes?: number; transformation?: string } = {};
      try {
        const signRes = await fetch(`/api/admin/proxy/cloudinary-sign?folder=${encodeURIComponent(folder)}`, { credentials: "same-origin" });
        if (signRes.ok) {
          signData = await signRes.json();
        }
      } catch {
        // The backend signature is mandatory for administrator uploads.
      }

      if (!signData.signature || !signData.apiKey || !signData.timestamp || !signData.cloudName || !signData.folder) throw new Error("Secure upload is unavailable");

      const cloudName = signData.cloudName || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "sm0xomj7";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", signData.folder);
      formData.append("allowed_formats", (signData.allowedFormats || []).join(","));
      formData.append("max_bytes", String(signData.maxBytes));
      formData.append("transformation", String(signData.transformation));
      formData.append("signature", signData.signature);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("api_key", signData.apiKey);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (typeof data.secure_url !== "string") throw new Error("Upload did not return an image URL");

      // Automatically optimize URL with f_auto, q_auto:good, and max width 1920
      const optimizedUrl = getOptimizedCloudinaryUrl(data.secure_url, {
        width: 1920,
        quality: "auto:good",
        crop: "limit",
      });
      onChange(optimizedUrl);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
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
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-[#586348] text-white rounded-xl font-semibold text-xs hover:bg-[#444D37] transition-colors shadow-xs"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
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
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
      />
      {error && <p className="text-xs text-red-600 mt-2 font-medium">{error}</p>}
    </div>
  );
}
