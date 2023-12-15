import React, { useId, forwardRef } from 'react';
import { HotTableClass } from './hotTableClass';
import { HotTableProps } from './types';

const HotTable = forwardRef<HotTableClass, HotTableProps>(({ children, ...props }, ref) => {
  const generatedId = useId();
  const componentId = props.id ?? generatedId;

  return (
    <HotTableClass id={componentId} {...props} ref={ref}>
      {children}
    </HotTableClass>
  );
})

export default HotTable;
export { HotTable };
