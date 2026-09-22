import React, {
  ForwardRefExoticComponent,
  RefAttributes,
  useId,
  forwardRef,
} from 'react';
import * as packageJson from '../package.json';
import { HotTableInner } from './hotTableInner';
import { HotTableProps, HotTableRef } from './types';
import { HotTableContextProvider } from './hotTableContext';

interface Version {
  version?: string;
}

type HotTable = ForwardRefExoticComponent<HotTableProps & RefAttributes<HotTableRef>> & Version;

/**
 * A Handsontable-ReactJS wrapper.
 *
 * To implement, use the `HotTable` tag with properties corresponding to Handsontable options.
 * For example:
 *
 * ```js
 * <HotTable id="hot" data={dataObject} contextMenu={true} colHeaders={true} width={600} height={300} stretchH="all" />
 *
 * // is analogous to
 * let hot = new Handsontable(document.getElementById('hot'), {
 *    data: dataObject,
 *    contextMenu: true,
 *    colHeaders: true,
 *    width: 600
 *    height: 300
 * });
 *
 * ```
 */
const HotTable: HotTable = forwardRef<HotTableRef, HotTableProps>(({ children, ...props }, ref) => {
  // `useId()` must run unconditionally on every render (never only when `id` is missing), or React
  // sees a different hook count between renders and throws "Rendered fewer hooks than expected".
  const generatedId = useId();
  const componentId = props.id ?? generatedId;

  return (
    <HotTableContextProvider>
      <HotTableInner id={componentId} {...props} ref={ref}>
        {children}
      </HotTableInner>
    </HotTableContextProvider>
  );
});

/**
 * Package version.
 *
 * @returns The version number of the package.
 */
HotTable.version = (packageJson as any).version;

export default HotTable;
export { HotTable };
