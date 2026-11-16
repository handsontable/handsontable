import React from 'react';
import { act } from '@testing-library/react';
import { registerAllModules } from 'handsontable/registry';
import { HotTable } from '../src/hotTable';
import { HotColumn } from '../src/hotColumn';
import { HotTableRef } from '../src/types';
import {
  mountComponent,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { TEST_LICENSE_KEY } from './licenseKey';

registerAllModules();

jest.setTimeout(10000);

describe('UndoRedo plugin in React wrapper', () => {
  describe('beforeChange hook execution order', () => {
    it('should record the modified value in UndoRedo when beforeChange modifies the change', async() => {
      const hotTableRef = mountComponentWithRef<HotTableRef>((
        <HotTable
          id="test-hot"
          data={[[0]]}
          licenseKey={TEST_LICENSE_KEY}
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

      await act(async() => {
        hotInstance.setDataAtCell(0, 0, 2);
      });

      expect(hotInstance.getDataAtCell(0, 0)).toBe(2);

      await act(async() => {
        hotInstance.setDataAtCell(0, 0, 10); // Will be capped
      });

      expect(hotInstance.getDataAtCell(0, 0)).toBe(5);

      const undoRedoPlugin = hotInstance.getPlugin('undoRedo') as any;

      expect(undoRedoPlugin.doneActions.length).toBe(2);

      const firstAction = undoRedoPlugin.doneActions[0];
      const secondAction = undoRedoPlugin.doneActions[1];

      expect(firstAction.changes[0][2]).toBe(0);
      expect(firstAction.changes[0][3]).toBe(2);

      expect(secondAction.changes[0][2]).toBe(2);
      expect(secondAction.changes[0][3]).toBe(5); // Capped

      await act(async() => {
        undoRedoPlugin.undo();
      });
      await sleep(50);

      expect(hotInstance.getDataAtCell(0, 0)).toBe(2);

      await act(async() => {
        undoRedoPlugin.undo();
      });
      await sleep(50);

      expect(hotInstance.getDataAtCell(0, 0)).toBe(0);
    });
  });

  describe('a re-render that passes the same rows', () => {
    /**
     * Mounts a grid inside a parent that re-renders on demand, makes one edit, and re-renders.
     *
     * @param {Function} renderGrid Renders the grid for a tick of the parent.
     * @returns {Promise<object>} The grid instance and the re-render trigger.
     */
    async function mountEditedGrid(
      renderGrid: (ref: React.RefObject<HotTableRef>, tick: number, bump: () => void) => React.ReactElement
    ) {
      const hotTableRef = React.createRef<HotTableRef>();
      let rerender: () => void = () => {};
      const Parent = () => {
        const [tick, setTick] = React.useState(0);

        rerender = () => setTick(value => value + 1);

        return renderGrid(hotTableRef, tick, rerender);
      };

      mountComponent(<Parent />);
      await act(async() => {
        await sleep(50);
      });

      const hot = hotTableRef.current!.hotInstance!;

      await act(async() => {
        hot.setDataAtCell(0, 0, 'edited');
      });

      return { hot,
        rerender: () => act(async() => {
          rerender(); await sleep(50);
        }) };
    }

    it('should keep the history when the parent re-renders with a stable `data`', async() => {
      const data = [['A1', 'B1'], ['A2', 'B2']];
      const { hot, rerender } = await mountEditedGrid(ref => (
        <HotTable ref={ref} data={data} licenseKey={TEST_LICENSE_KEY} />
      ));

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      await act(async() => {
        hot.getPlugin('undoRedo').undo();
      });

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should keep the history when `afterChange` copies the array into the state', async() => {
      const { hot, rerender } = await mountEditedGrid((ref) => {
        const [data, setData] = React.useState([['A1', 'B1'], ['A2', 'B2']]);

        return (
          <HotTable
            ref={ref}
            data={data}
            afterChange={(changes, source) => {
              if (source !== 'loadData' && changes) {
                setData(rows => rows.slice());
              }
            }}
            licenseKey={TEST_LICENSE_KEY}
          />
        );
      });

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      await act(async() => {
        hot.getPlugin('undoRedo').undo();
      });

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should keep the history of a grid with `HotColumn` children', async() => {
      const data = [['A1', 'B1'], ['A2', 'B2']];
      const { hot, rerender } = await mountEditedGrid(ref => (
        <HotTable ref={ref} data={data} licenseKey={TEST_LICENSE_KEY}>
          <HotColumn data={0} />
          <HotColumn data={1} />
        </HotTable>
      ));

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
    });

    it('should keep the history when `afterChange` mirrors the edit as an immutable row update', async() => {
      const { hot, rerender } = await mountEditedGrid((ref) => {
        const [data, setData] = React.useState([['A1', 'B1'], ['A2', 'B2']]);

        return (
          <HotTable
            ref={ref}
            data={data}
            afterChange={(changes, source) => {
              if (source === 'loadData' || !changes) {
                return;
              }

              const [row, column, , value] = changes[0];

              setData(rows => rows.map((cells, index) => (
                index === row ? cells.map((cell, cellColumn) => (cellColumn === column ? value : cell)) : cells
              )));
            }}
            licenseKey={TEST_LICENSE_KEY}
          />
        );
      });

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);

      await act(async() => {
        hot.getPlugin('undoRedo').undo();
      });

      expect(hot.getDataAtCell(0, 0)).toBe('A1');
    });

    it('should keep the history when `afterChange` mirrors the edit into rows that are objects', async() => {
      const { hot, rerender } = await mountEditedGrid((ref) => {
        const [data, setData] = React.useState([{ a: 'A1', b: 'B1' }, { a: 'A2', b: 'B2' }]);

        return (
          <HotTable
            ref={ref}
            data={data}
            columns={[{ data: 'a' }, { data: 'b' }]}
            afterChange={(changes, source) => {
              if (source === 'loadData' || !changes) {
                return;
              }

              const [row, prop, , value] = changes[0];

              setData(rows => rows.map((item, index) => (index === row ? { ...item, [prop as string]: value } : item)));
            }}
            licenseKey={TEST_LICENSE_KEY}
          />
        );
      });

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
    });

    it('should drop the history when the parent passes a new array of new rows', async() => {
      const { hot, rerender } = await mountEditedGrid(ref => (
        <HotTable ref={ref} data={[['A1', 'B1'], ['A2', 'B2']]} licenseKey={TEST_LICENSE_KEY} />
      ));

      await rerender();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);
    });
  });
});
