declare global {
  interface Liveblocks {
    ThreadMetadata: {
      rowId: string;
      columnId: string;
    };
  }
}

export {};
