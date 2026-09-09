"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface SavedSpaceItem {
  id: string;
  type: "project" | "material" | "room";
  title: string;
  subtitle?: string;
  image?: string;
  hex?: string;
  notes?: string;
  addedAt: number;
}

interface SpaceCollectionContextType {
  items: SavedSpaceItem[];
  addItem: (item: Omit<SavedSpaceItem, "addedAt">) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: Omit<SavedSpaceItem, "addedAt">) => void;
  hasItem: (id: string) => boolean;
  clearCollection: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalCount: number;
}

const SpaceCollectionContext = createContext<SpaceCollectionContextType | undefined>(undefined);

const STORAGE_KEY = "banglasketch_space_collection_v1";

export function SpaceCollectionProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedSpaceItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // localStorage may fail in private mode or SSR
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, mounted]);

  const addItem = (item: Omit<SavedSpaceItem, "addedAt">) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const toggleItem = (item: Omit<SavedSpaceItem, "addedAt">) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) {
        return prev.filter((i) => i.id !== item.id);
      }
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  };

  const hasItem = (id: string) => {
    return items.some((i) => i.id === id);
  };

  const clearCollection = () => {
    setItems([]);
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <SpaceCollectionContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        toggleItem,
        hasItem,
        clearCollection,
        isDrawerOpen,
        setIsDrawerOpen,
        openDrawer,
        closeDrawer,
        totalCount: items.length,
      }}
    >
      {children}
    </SpaceCollectionContext.Provider>
  );
}

export function useSpaceCollection() {
  const context = useContext(SpaceCollectionContext);
  if (!context) {
    throw new Error("useSpaceCollection must be used within a SpaceCollectionProvider");
  }
  return context;
}
