"use client";

import React from "react";
import { FiBookmark, FiCheck } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

interface SaveProjectButtonProps {
  id: string;
  title: string;
  category: string;
  image: string;
}

export function SaveProjectButton({ id, title, category, image }: SaveProjectButtonProps) {
  const { toggleItem, hasItem } = useSpaceCollection();
  const isSaved = hasItem(id);

  return (
    <button
      onClick={() =>
        toggleItem({
          id,
          type: "project",
          title,
          subtitle: category.replace("-", " ").toUpperCase(),
          image,
        })
      }
      className={`btn text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 ${
        isSaved
          ? "bg-[#A45138] text-white border border-[#A45138]"
          : "bg-[#FAF7F2] text-[#242622] border border-[#DDD5C8] hover:border-[#727A61]"
      }`}
      title={isSaved ? "Saved in collection" : "Save this project to your Space Collection"}
    >
      {isSaved ? (
        <>
          <FiCheck size={14} />
          <span>Saved in Collection</span>
        </>
      ) : (
        <>
          <FiBookmark size={14} />
          <span>Save to Collection</span>
        </>
      )}
    </button>
  );
}
