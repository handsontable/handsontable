"use client";

import { useState, createContext, useContext } from "react";
import { useThreads } from "@liveblocks/react/suspense";
import { ThreadData } from "@liveblocks/client";

export type OpenCell = { rowId: string; columnId: string } | null;

type CellThreadContextValue = {
  threads: ThreadData[];
  openCell: OpenCell;
  setOpenCell: (openCell: OpenCell) => void;
};

const CellThreadContext = createContext<CellThreadContextValue | null>(null);

export function CellThreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { threads } = useThreads();
  const [openCell, setOpenCell] = useState<OpenCell>(null);

  return (
    <CellThreadContext.Provider value={{ threads, openCell, setOpenCell }}>
      {children}
    </CellThreadContext.Provider>
  );
}

export function useCellThread(): CellThreadContextValue {
  const context = useContext(CellThreadContext);
  if (!context) {
    throw new Error("useCellThread must be used within CellThreadProvider");
  }
  return context;
}
