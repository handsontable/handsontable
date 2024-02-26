import React from 'react';

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

const HotColumnContext = React.createContext<HotColumnContextImpl | undefined>(undefined);

const HotColumnContextProvider: React.FC<React.PropsWithChildren<HotColumnContextImpl>> = ({ columnIndex, getOwnerDocument, children }) => {

  const contextImpl: HotColumnContextImpl = React.useMemo(() => ({
    columnIndex,
    getOwnerDocument
  }), [columnIndex, getOwnerDocument]);

  return (
    <HotColumnContext.Provider value={contextImpl}>{children}</HotColumnContext.Provider>
  );
};

const useHotColumnContext = () => React.useContext(HotColumnContext)!;

export { useHotColumnContext, HotColumnContextProvider };
