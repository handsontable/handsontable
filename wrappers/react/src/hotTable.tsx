import React, { useId } from 'react';
import Handsontable from 'handsontable/base';
import { HotTableCB } from './hotTableClassBased';
import {
  HotTableProps,
} from './types';

const HotTable = React.forwardRef<Handsontable, HotTableProps>(({ children, ...props }, ref) => {
  if (!props.id) {
    props.id = useId();
  }

  return (
    <HotTableCB {...props} ref={ref}>
      {children}
    </HotTableCB>
  );
})

export default HotTable;
export { HotTable };
