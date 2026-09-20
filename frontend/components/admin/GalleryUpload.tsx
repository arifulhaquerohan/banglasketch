"use client";

import { FiImage, FiTrash2 } from "react-icons/fi";
import { CloudinaryUpload } from "./CloudinaryUpload";

interface GalleryUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
}

export function GalleryUpload({ value, onChange, folder = "banglasketch/projects/gallery" }: GalleryUploadProps) {
  const gallery = value.slice(0, 12);

  const updateAt = (index: number, url: string) => {
    const next = [...gallery];
    if (url) next[index] = url;
    else next.splice(index, 1);
    onChange(next.filter(Boolean));
  };

  const addImage = (url: string) => {
    if (!url) return;
    onChange([...gallery, url]);
  };

  return (
    <div className="space-y-3">
      {gallery.length > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {gallery.map((url, index) => (
            <div key={`${url}-${index}`} className="relative rounded-2xl border border-admin-border bg-white p-2 shadow-2xs">
              <CloudinaryUpload
                value={url}
                onChange={(nextUrl) => updateAt(index, nextUrl)}
                folder={folder}
                label=""
              />
              <button
                type="button"
                onClick={() => updateAt(index, "")}
                className="absolute right-3 top-3 rounded-lg bg-red-600 p-2 text-white shadow-xs transition-colors hover:bg-red-700"
                aria-label="Remove gallery image"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {gallery.length < 12 ? (
        <CloudinaryUpload
          value=""
          onChange={addImage}
          folder={folder}
          label={gallery.length ? "Add Another Gallery Image" : ""}
        />
      ) : (
        <div className="rounded-2xl border border-admin-border bg-admin-canvas p-4 text-center text-xs text-admin-muted">
          <FiImage className="mx-auto mb-2 text-admin-primary" size={20} />
          Gallery limit reached.
        </div>
      )}
    </div>
  );
}
