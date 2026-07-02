"use client";

import {
  CommentPin,
  FloatingComposer,
  FloatingThread,
  Icon,
} from "@liveblocks/react-ui";
import type { HotRendererProps } from "@handsontable/react-wrapper";
import { useSelf } from "@liveblocks/react";
import { CSSProperties, useState } from "react";
import { useCellThread } from "./CellThreadContext";

export function CommentCell({
  instance,
  row,
  col,
  prop,
  value,
}: HotRendererProps) {
  const columnId = String(prop);
  const rowId = String(instance.getDataAtRowProp(row, "id") ?? "");

  if (!rowId || !columnId) {
    return null;
  }

  return (
    <CommentCellBody
      key={`${row}-${col}-${rowId}-${columnId}`}
      rowId={rowId}
      columnId={columnId}
      value={value}
    />
  );
}

const COMMENT_PIN_SIZE = 24;

const commentPinStyle = {
  "--lb-comment-pin-padding": "3px",
  width: COMMENT_PIN_SIZE,
  height: COMMENT_PIN_SIZE,
  cursor: "pointer",
  marginTop: 3,
  boxSizing: "border-box",
} as CSSProperties;

function CommentCellBody({
  rowId,
  columnId,
  value,
}: {
  rowId: string;
  columnId: string;
  value: unknown;
}) {
  const { threads, openCell, setOpenCell } = useCellThread();
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const currentUserId = useSelf((self) => self.id) ?? undefined;

  const thread = threads.find(
    ({ metadata }) =>
      metadata.rowId === rowId && metadata.columnId === columnId,
  );

  const defaultOpen =
    openCell !== null &&
    openCell.rowId === rowId &&
    openCell.columnId === columnId;

  const metadata = { rowId, columnId };

  return (
    <div
      className="comment-cell"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span className="comment-cell-value">
        {String(value ?? "")}
      </span>

      {!thread ? (
        <div
          className="comment-cell-trigger"
          data-open={isComposerOpen || undefined}
        >
          <FloatingComposer
            metadata={metadata}
            onComposerSubmit={() => setOpenCell(metadata)}
            onOpenChange={setIsComposerOpen}
            style={{ zIndex: 10 }}
          >
            <CommentPin
              corner="top-left"
              style={commentPinStyle}
              userId={currentUserId}
            >
              {!isComposerOpen ? (
                <Icon.Plus style={{ width: 14, height: 14 }} />
              ) : null}
            </CommentPin>
          </FloatingComposer>
        </div>
      ) : (
        <FloatingThread
          thread={thread}
          defaultOpen={defaultOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen && defaultOpen) {
              setOpenCell(null);
            }
          }}
          onComposerSubmit={() => setOpenCell(metadata)}
          style={{ zIndex: 10 }}
          autoFocus
        >
          <CommentPin
            corner="top-left"
            style={commentPinStyle}
            userId={thread.comments[0]?.userId}
          />
        </FloatingThread>
      )}
    </div>
  );
}
