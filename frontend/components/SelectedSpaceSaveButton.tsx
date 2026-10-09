"use client";

import { FiBookmark, FiCheck } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface SelectedSpaceSaveButtonProps {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export function SelectedSpaceSaveButton({ id, title, subtitle, image }: SelectedSpaceSaveButtonProps) {
  const { toggleItem, hasItem } = useSpaceCollection();
  const isSaved = hasItem(id);

  return (
    <button
      type="button"
      aria-pressed={isSaved}
      aria-label={isSaved ? `Remove ${title} from your saved spaces` : `Save ${title} to your collection`}
      onClick={() => toggleItem({ id, type: "project", title, subtitle, image })}
      className={`absolute right-4 top-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[11px] font-semibold transition-colors sm:right-5 sm:top-5 ${
        isSaved
          ? "bg-[#303529] text-[#FAF7F2] hover:bg-[#A45138]"
          : "bg-[#FAF7F2]/95 text-[#303529] hover:bg-[#FAF7F2]"
      }`}
    >
      {isSaved ? <FiCheck size={14} aria-hidden="true" /> : <FiBookmark size={14} aria-hidden="true" />}
      <span>{isSaved ? "Saved" : "Save"}</span>
    </button>
  );
}
