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
}

const HotColumnContext = createContext<HotColumnContextImpl | undefined>(undefined);

const HotColumnContextProvider: FC<PropsWithChildren<HotColumnContextImpl>> = ({ columnIndex, getOwnerDocument, children }) => {

  const contextImpl: HotColumnContextImpl = useMemo(() => ({
    columnIndex,
    getOwnerDocument
  }), [columnIndex, getOwnerDocument]);

  return (
    <HotColumnContext.Provider value={contextImpl}>{children}</HotColumnContext.Provider>
  );
};

const useHotColumnContext = () => useContext(HotColumnContext)!;

export { useHotColumnContext, HotColumnContextProvider };
