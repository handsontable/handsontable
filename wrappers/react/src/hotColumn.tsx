import React, { useEffect, useRef } from "react";
import {
  HotTableProps,
  HotColumnProps,
  HotEditorCache,
  EditorScopeIdentifier,
} from "./types";
import { createEditorPortal, getExtendedEditorElement } from "./helpers";
import { SettingsMapper } from "./settingsMapper";
import Handsontable from "handsontable/base";

export interface HotColumn {
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
  columnSettings: Handsontable.ColumnSettings;
}

const HotColumn = (props: HotColumn) => {
  const prevPropsRef = useRef<HotColumnProps>();
  const settingsPropsRef = useRef<HotColumnProps>();
  const columnSettings = useRef<Handsontable.ColumnSettings>();

  useEffect(() => {
    prevPropsRef.current = props;
  });

  const prevProps = prevPropsRef.current;

  useEffect(() => {
    createColumnSettings();
    emitColumnSettings();
  }, [props, prevProps]);

  const createColumnSettings = () => {
    const rendererElement = props.getChildElementByType(
      props.children,
      "hot-renderer"
    );
    const editorElement = getLocalEditorElement();

    const currentColumnSettings = { ...props.columnSettings };

    if (rendererElement !== null) {
      currentColumnSettings.renderer =
        props.getRendererWrapper(rendererElement);
      props.componentRendererColumns.set(props.columnIndex, true);
    }

    if (editorElement !== null) {
        currentColumnSettings.editor = props.getEditorClass(
        editorElement,
        props.columnIndex
      );
    }
  };

  const emitColumnSettings = () => {
    props.onColumnSettingsChange(columnSettings, props.columnIndex);
  };

  const getLocalEditorElement = () => {
    return getExtendedEditorElement(
      props.children,
      props.getEditorCache(),
      props.columnIndex
    );
  };

  const ownerDocument = props.getOwnerDocument();
  const editorPortal = createEditorPortal(
    ownerDocument,
    getLocalEditorElement()
  );

  return <React.Fragment>{editorPortal}</React.Fragment>;
};

export default HotColumn;
export { HotColumn };
