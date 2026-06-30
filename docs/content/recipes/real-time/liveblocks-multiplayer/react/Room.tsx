"use client";

import { LiveList } from "@liveblocks/client";
import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { GRID_COLS, GRID_ROWS } from "./liveblocks.config";

export function Room({ children }: { children: ReactNode }) {
  return (
    <LiveblocksProvider publicApiKey={"{{PUBLIC_KEY}}"}>
      <RoomProvider
        id="my-room"
        initialPresence={{ selectedCell: null }}
        initialStorage={{
          grid: new LiveList(
            Array.from(
              { length: GRID_ROWS },
              () => new LiveList(Array.from({ length: GRID_COLS }, () => ""))
            )
          ),
        }}
      >
        <ClientSideSuspense fallback={<div>Loading…</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
