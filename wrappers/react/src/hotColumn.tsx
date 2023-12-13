import React, { useEffect, useRef, useState } from "react";
import { HotTableProps, HotEditorCache, EditorScopeIdentifier } from "./types";
import { createEditorPortal, getExtendedEditorElement } from "./helpers";
import { SettingsMapper } from "./settingsMapper";
import Handsontable from "handsontable/base";

export interface HotColumnProps {
  columnIndex: number;
  children: React.ReactNode;
  onColumnSettingsChange: (
    columnSettings: Handsontable.ColumnSettings,
    columnIndex: number
  ) => void;
  componentRendererColumns?: Map<number | string, boolean>;
  getChildElementByType?: (
    children: React.ReactNode,
    type: string
  ) => React.ReactElement;
  getRendererWrapper?: (
    rendererNode: React.ReactElement
  ) => typeof Handsontable.renderers.BaseRenderer;
  getEditorClass?: (
    editorElement: React.ReactElement,
    editorColumnScope: EditorScopeIdentifier
  ) => typeof Handsontable.editors.BaseEditor;
  getEditorCache?: () => HotEditorCache;
  getOwnerDocument?: () => Document;
}

const HotColumn = (props: HotColumnProps) => {
  const [editorElement, setEditorElement] = useState(
    getExtendedEditorElement(
      props.children,
      props.getEditorCache(),
      props.columnIndex
    )
  );

  useEffect(() => {
    const rendererElement = props.getChildElementByType(
      props.children,
      "hot-renderer"
    );
    setEditorElement(
      getExtendedEditorElement(
        props.children,
        props.getEditorCache(),
        props.columnIndex
      )
    );
    const columnSettings: Handsontable.ColumnSettings = {};

    if (rendererElement !== null) {
      columnSettings.renderer = props.getRendererWrapper(rendererElement);
      props.componentRendererColumns.set(props.columnIndex, true);
    }

    if (editorElement !== null) {
      columnSettings.editor = props.getEditorClass(
        editorElement,
        props.columnIndex
      );
    }

    props.onColumnSettingsChange(columnSettings, props.columnIndex);
  }, [
    props.getChildElementByType,
    props.children,
    props.columnIndex,
    props.getRendererWrapper,
    props.componentRendererColumns,
    props.getEditorCache,
  ]);

  const ownerDocument = props.getOwnerDocument();
  const editorPortal = createEditorPortal(
    ownerDocument,
    editorElement
  );

  return <React.Fragment>{editorPortal}</React.Fragment>;
};

export default HotColumn;
export { HotColumn };
