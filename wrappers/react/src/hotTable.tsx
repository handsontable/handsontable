import React, { useId, forwardRef, ForwardRefExoticComponent, RefAttributes } from 'react';
import { HotTableClass } from './hotTableClass';
import { HotTableProps } from './types';

interface Version {
  version?: string;
}

type HotTable = ForwardRefExoticComponent<HotTableProps & RefAttributes<HotTableClass>> & Version;

const HotTable: HotTable = forwardRef<HotTableClass, HotTableProps>(({ children, ...props }, ref) => {
  const generatedId = useId();
  const componentId = props.id ?? generatedId;

  return (
    <HotTableClass id={componentId} {...props} ref={ref}>
      {children}
    </HotTableClass>
  );
})

HotTable.version = HotTableClass.version;

export default HotTable;
export { HotTable };
