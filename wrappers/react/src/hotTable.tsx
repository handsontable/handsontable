import React, { useId } from 'react';
import Handsontable from 'handsontable/base';
import { HotTableClass } from './hotTableClass';
import {
  HotTableProps,
} from './types';

const HotTable = React.forwardRef<Handsontable, HotTableProps>(({ children, ...props }, ref) => {
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
