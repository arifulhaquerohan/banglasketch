"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect } from "react";
import { FiBookmark, FiCompass, FiSend, FiTrash2, FiX } from "react-icons/fi";
import { useSpaceCollection } from "./SpaceCollectionContext";

export function SpaceCollectionDrawer() {
  const { items, isDrawerOpen, openDrawer, closeDrawer, removeItem, clearCollection, totalCount } =
    useSpaceCollection();

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const projects = items.filter((i) => i.type === "project");
  const materials = items.filter((i) => i.type === "material");
  const rooms = items.filter((i) => i.type === "room");

  return (
    <>
      {/* Floating Trigger Pill (Fixed on bottom right above WhatsApp) */}
      <button
        onClick={() => (isDrawerOpen ? closeDrawer() : (items.length > 0 || true) && closeDrawer(), void 0)}
        type="button"
        aria-label="Open your Space Collection"
        className="sr-only"
      >
        Open
      </button>

      {/* Floating Space Collection Badge */}
      {totalCount > 0 && !isDrawerOpen && (
        <aside
          aria-label="Your Space Collection quick access"
          className="fixed bottom-24 right-5 sm:right-7 z-40 animate-fade-in"
        >
          <button
            onClick={openDrawer}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#242622] text-[#F4F0E8] shadow-2xl border border-[#DDD5C8]/40 hover:bg-[#727A61] transition-all duration-300 group"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A45138] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A45138]" />
            </span>
            <span className="font-serif text-sm tracking-wide">Your Space Collection</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#A45138] text-white text-[11px] font-bold">
              {totalCount}
            </span>
          </button>
        </aside>
      )}

      {/* Backdrop */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-[#242622]/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={closeDrawer}
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#F4F0E8] border-l border-[#DDD5C8] z-50 shadow-2xl flex flex-col transform transition-transform duration-400 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="space-collection-title"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#DDD5C8] flex items-center justify-between bg-[#FAF7F2]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#A45138]" />
              <span className="architectural-tag text-[#727A61]">Curation Tray</span>
            </div>
            <h2 id="space-collection-title" className="font-serif text-2xl font-semibold text-[#242622] mt-0.5">
              Your Space Collection
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg text-[#5A6057] hover:text-[#242622] hover:bg-[#E8E2D7] transition-colors"
            aria-label="Close drawer"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#DDD5C8]/40 border border-[#DDD5C8] flex items-center justify-center text-[#727A61]">
                <FiBookmark size={28} />
              </div>
              <h3 className="font-serif text-xl font-medium text-[#242622]">Your collection is empty</h3>
              <p className="text-sm text-[#5A6057] leading-relaxed max-w-xs mx-auto">
                Explore our spaces, projects, and material palettes. Click the bookmark icon or “Save to Collection” to curate your sanctuary.
              </p>
              <div className="pt-2">
                <Link
                  href="/portfolio"
                  onClick={closeDrawer}
                  className="btn btn-clay text-xs px-5 py-2.5 inline-flex"
                >
                  <span>Explore Portfolio</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[#5A6057] pb-2 border-b border-[#DDD5C8]">
                <span>
                  {totalCount} {totalCount === 1 ? "element" : "elements"} curated
                </span>
                <button
                  onClick={clearCollection}
                  className="text-[#A45138] hover:underline flex items-center gap-1 font-medium"
                >
                  <FiTrash2 size={12} /> Clear all
                </button>
              </div>

              {/* Projects Section */}
              {projects.length > 0 && (
                <div className="space-y-3">
                  <h4 className="architectural-tag text-[#727A61]">Saved Projects ({projects.length})</h4>
                  <div className="space-y-2.5">
                    {projects.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF7F2] border border-[#DDD5C8] group hover:border-[#727A61] transition-colors"
                      >
                        {item.image && (
                          <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 bg-[#DDD5C8]">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-base font-semibold text-[#242622] truncate">
                            {item.title}
                          </h5>
                          {item.subtitle && (
                            <p className="text-xs text-[#5A6057] truncate">{item.subtitle}</p>
                          )}
                          {item.notes && (
                            <p className="text-[11px] text-[#727A61] italic line-clamp-1 mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-[#5A6057] hover:text-[#A45138] transition-colors"
                          aria-label={`Remove ${item.title}`}
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materials Section */}
              {materials.length > 0 && (
                <div className="space-y-3">
                  <h4 className="architectural-tag text-[#727A61]">
                    Curated Materials ({materials.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    {materials.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-[#FAF7F2] border border-[#DDD5C8] flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {item.hex && (
                            <span
                              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: item.hex }}
                            />
                          )}
                          <span className="text-xs font-semibold text-[#242622] truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.subtitle && (
                          <span className="text-[10px] uppercase tracking-wider text-[#727A61] mb-2">
                            {item.subtitle}
                          </span>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-[#DDD5C8]/60">
                          <span className="text-[10px] text-[#5A6057] font-mono">{item.hex}</span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-[#5A6057] hover:text-[#A45138] transition-colors"
                            aria-label={`Remove ${item.title}`}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Rooms Section */}
              {rooms.length > 0 && (
                <div className="space-y-3">
                  <h4 className="architectural-tag text-[#727A61]">Rooms of Interest ({rooms.length})</h4>
                  <div className="space-y-2.5">
                    {rooms.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-[#FAF7F2] border border-[#DDD5C8]"
                      >
                        {item.image && (
                          <div className="relative w-14 h-14 rounded overflow-hidden shrink-0 bg-[#DDD5C8]">
                            <Image
                              src={item.image}
                              alt={item.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-serif text-sm font-semibold text-[#242622] truncate">
                            {item.title}
                          </h5>
                          {item.notes && (
                            <p className="text-xs text-[#5A6057] line-clamp-1">{item.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-[#5A6057] hover:text-[#A45138] transition-colors"
                          aria-label={`Remove ${item.title}`}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#DDD5C8] bg-[#FAF7F2] space-y-3">
            <Link
              href={`/design-brief?collection=${encodeURIComponent(
                JSON.stringify(
                  items.map((i) => ({ id: i.id, title: i.title, type: i.type, notes: i.notes }))
                )
              )}`}
              onClick={closeDrawer}
              className="w-full btn btn-clay text-sm py-3 flex items-center justify-center gap-2"
            >
              <FiCompass size={16} />
              <span>Generate Design Brief with Collection</span>
            </Link>

            <Link
              href={`/contact?collectionNotes=${encodeURIComponent(
                `Attached Space Collection (${items.length} items):\n` +
                  items.map((i) => `- [${i.type.toUpperCase()}] ${i.title}`).join("\n")
              )}`}
              onClick={closeDrawer}
              className="w-full btn btn-secondary text-sm py-3 flex items-center justify-center gap-2"
            >
              <FiSend size={15} />
              <span>Enquire with this Collection</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
