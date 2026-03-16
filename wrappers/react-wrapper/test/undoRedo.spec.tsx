import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotTableRef } from '../src/types';
import {
  mountComponentWithRef,
  sleep,
} from './_helpers';

registerAllModules();

jest.setTimeout(10000);

describe('UndoRedo plugin in React wrapper', () => {
  describe('beforeChange hook execution order', () => {
    it('should preserve undo history when beforeChange modifies the change', async () => {
      const hotTableRef = mountComponentWithRef<HotTableRef>((
        <HotTable
          id="test-hot"
          data={[[0]]}
          licenseKey="non-commercial-and-evaluation"
          beforeChange={(changes) => {
            for (let i = 0; i < changes!.length; i++) {
              if (changes![i] && changes![i]![3] > 5) {
                changes![i]![3] = 5; // Cap values at 5
              }
            }
          }}
        />
      ));

      const hotInstance = hotTableRef.hotInstance!;

      expect(hotInstance).not.toBe(null);
      expect(hotInstance.getDataAtCell(0, 0)).toBe(0);

      await act(async () => {
        hotInstance.setDataAtCell(0, 0, 2);
      });

      expect(hotInstance.getDataAtCell(0, 0)).toBe(2);

      await act(async () => {
        hotInstance.setDataAtCell(0, 0, 10); // Will be capped
      });

      expect(hotInstance.getDataAtCell(0, 0)).toBe(5);

      const undoRedoPlugin = hotInstance.getPlugin('undoRedo') as any;

      expect(undoRedoPlugin.doneActions.length).toBe(2);

      await act(async () => {
        undoRedoPlugin.undo();
      });
      await sleep(50);

      expect(hotInstance.getDataAtCell(0, 0)).toBe(2);

      await act(async () => {
        undoRedoPlugin.undo();
      });
      await sleep(50);

      expect(hotInstance.getDataAtCell(0, 0)).toBe(0);
    });
  });
});
