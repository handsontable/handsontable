import React, { ForwardRefExoticComponent, RefAttributes } from 'react';
import { HotTableClass } from './hotTableClass';
import { HotTableProps } from './types';
import { HotTableContextProvider } from './hotTableContext'

interface Version {
  version?: string;
}

type HotTable = ForwardRefExoticComponent<HotTableProps & RefAttributes<HotTableClass>> & Version;

// Use global React variable for `forwardRef` access (React 16 support)
const HotTable: HotTable = React.forwardRef<HotTableClass, HotTableProps>(({ children, ...props }, ref) => {
  const generatedId = typeof React.useId === 'function' ? React.useId() : undefined;
  const componentId = props.id ?? generatedId;

  return (
    <HotTableContextProvider>
      <HotTableClass id={componentId} {...props} ref={ref}>
        {children}
      </HotTableClass>
    </HotTableContextProvider>
  );
})

HotTable.version = HotTableClass.version;

export default HotTable;
export { HotTable };
