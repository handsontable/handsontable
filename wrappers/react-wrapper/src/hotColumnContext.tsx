import React, {
  FC,
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from 'react';

export interface HotColumnContextImpl {
  /**
   * Column index within a HotTable.
   */
  readonly columnIndex: number;

  /**
   * Get the `Document` object corresponding to the main component element.
   *
   * @returns The `Document` object used by the component.
   */
  readonly getOwnerDocument: () => Document | null;

  /**
   * Get the stable host element for React editor portals.
   *
   * @returns The host element, or `null` before a document is available.
   */
  readonly getEditorPortalHost: () => HTMLElement | null;
}

const HotColumnContext = createContext<HotColumnContextImpl | undefined>(undefined);

const HotColumnContextProvider: FC<PropsWithChildren<HotColumnContextImpl>> = ({
  columnIndex,
  getOwnerDocument,
  getEditorPortalHost,
  children
}) => {

  const contextImpl: HotColumnContextImpl = useMemo(() => ({
    columnIndex,
    getOwnerDocument,
    getEditorPortalHost
  }), [columnIndex, getOwnerDocument, getEditorPortalHost]);

  return (
    <HotColumnContext.Provider value={contextImpl}>{children}</HotColumnContext.Provider>
  );
};

const useHotColumnContext = () => useContext(HotColumnContext)!;

export { useHotColumnContext, HotColumnContextProvider };
