<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { HotTable, HotColumn } from '@handsontable/vue3';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable/base';
import type { CellProperties, GridSettings } from 'handsontable/settings';

// Register all Handsontable's modules.
registerAllModules();

type DetectedType = 'text' | 'numeric' | 'date';

/**
 * The recipe's configuration.
 * - `skipTypes`: types that detection never assigns.
 * - `beforeTypeChange`: return `false` to keep the cell's current type.
 */
const autoDetectConfig = {
  skipTypes: [] as DetectedType[],
  beforeTypeChange(_row: number, _col: number, from: string, to: DetectedType, value: unknown): boolean {
    // A numeric cell stays numeric when someone types text into it, and the numeric validator
    // flags the entry. Clearing the cell still resets it to text.
    return !(from === 'numeric' && to === 'text' && value !== '' && value !== null);
  },
};

// Edits, pastes, cuts, undo, and redo trigger detection, so a cell's type follows its value.
// Autofill and `loadData()` do not.
const DETECT_SOURCES = ['edit', 'CopyPaste.paste', 'CopyPaste.cut', 'UndoRedo.undo', 'UndoRedo.redo'];

// Digits with at most one dot, an optional sign, and an optional exponent. No spaces.
const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d+)?|\.\d+)(e[+-]?\d+)?$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// Accepts ISO 8601 dates (`YYYY-MM-DD`), the format the date cell type stores, and rejects
// dates that don't exist, such as 2026-02-31.
function isDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const [, year, month, day] = match.map(Number);
  // `setFullYear()` takes years 0 to 99 as they are. `new Date(year, ...)` would map them to 1900 to 1999.
  const date = new Date(2000, 0, 1);

  date.setFullYear(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function detectCellType(value: unknown, skipTypes: DetectedType[]): DetectedType {
  if (typeof value === 'number' && Number.isFinite(value) && !skipTypes.includes('numeric')) {
    return 'numeric';
  }

  if (typeof value === 'string') {
    if (!skipTypes.includes('numeric') && NUMERIC_PATTERN.test(value)) {
      return 'numeric';
    }

    if (!skipTypes.includes('date') && isDate(value)) {
      return 'date';
    }
  }

  return 'text';
}

// Setting a type copies that type's renderer, editor, and other settings into the cell's meta. It
// does not remove the settings that only the previous type defined, so a date cell that turns into
// text would keep its date validator and formatter. These lists name what each type must not keep.
const LEFTOVER_KEYS: Record<DetectedType, string[]> = {
  text: ['validator', 'valueFormatter', 'valueSetter', 'dataType', 'sourceDataValidator', 'sourceDataWarningMessage'],
  numeric: ['sourceDataValidator', 'sourceDataWarningMessage'],
  date: ['valueSetter', 'dataType'],
};

const typeSettings: Record<DetectedType, Partial<CellProperties>> = {
  text: { type: 'text' },
  numeric: { type: 'numeric' },
  date: { type: 'date' },
};

// The numeric renderer writes `htRight` and `htNumeric` into the cell's own `className` meta, and a
// failed numeric validation marks the cell invalid. Neither goes away when the cell stops being
// numeric, for example after an undo, so remove them here. Removing the cell's own `className`
// brings back the class names of the column and the table. Returns `true` when it changed something.
function clearNumericResidue(hot: Handsontable, row: number, col: number): boolean {
  const cellMeta = hot.getCellMetaTransient(row, col);
  const classNames = Array.isArray(cellMeta.className) ? cellMeta.className : (cellMeta.className ?? '').split(/\s+/);

  if (cellMeta.type === 'numeric' || !classNames.includes('htNumeric')) {
    return false;
  }

  hot.removeCellMeta(row, col, 'className');

  // The invalid mark is cleared only for a cell that just left the numeric type. A validator that
  // you set on the column or the table keeps its mark.
  if (cellMeta.type === 'text' && cellMeta.valid === false) {
    hot.setCellMeta(row, col, 'valid', true);
  }

  return true;
}

// Switches a cell to one of the detected types.
function applyType(hot: Handsontable, row: number, col: number, type: DetectedType): void {
  Object.entries(typeSettings[type]).forEach(([key, setting]) => hot.setCellMeta(row, col, key, setting));
  LEFTOVER_KEYS[type].forEach((key) => hot.removeCellMeta(row, col, key));
}

// Detects the type of one cell. Returns `true` when the cell changed.
// After an undo or redo, `restoring` is `true`: UndoRedo puts back the cell's `type` but not the
// renderer, editor, and validator that came with it, so the type's settings are applied again.
function detectCell(hot: Handsontable, row: number, col: number, restoring = false): boolean {
  // Read with `getCellMetaTransient()`. It stores no meta for the cells that do not change.
  const cellMeta = hot.getCellMetaTransient(row, col);
  const from = cellMeta.type ?? 'text';

  // `autoDetect: false` opts a cell, a column, or the whole table out. Cells of any other type,
  // such as `dropdown` or `checkbox`, are left alone.
  if (cellMeta.autoDetect === false || !(from in typeSettings)) {
    return false;
  }

  const value = hot.getDataAtCell(row, col);
  const to = detectCellType(value, autoDetectConfig.skipTypes);
  const typeChanges = from !== to && autoDetectConfig.beforeTypeChange(row, col, from, to, value);
  let changed = false;

  if (typeChanges || restoring) {
    applyType(hot, row, col, (typeChanges ? to : from) as DetectedType);
    changed = true;
  }

  if (typeChanges) {
    // Drop the invalid mark that the previous type's validator left behind.
    hot.setCellMeta(row, col, 'valid', true);
  }

  return clearNumericResidue(hot, row, col) || changed;
}

function detectChanged(
  hot: Handsontable,
  changes: Handsontable.CellChange[] | null,
  source: string
): void {
  if (!changes || !DETECT_SOURCES.includes(source)) {
    return;
  }

  let changed = false;

  changes.forEach(([row, prop]) => {
    // A column can be addressed by a function in `data`. Detection skips those.
    if (typeof prop === 'function') {
      return;
    }

    const col = hot.propToCol(prop);

    if (typeof col === 'number') {
      changed = detectCell(hot, row, col, source.startsWith('UndoRedo')) || changed;
    }
  });

  if (changed) {
    hot.render();
  }
}

function detectAll(hot: Handsontable): void {
  // `batch()` does not render on its own, so render inside the callback.
  hot.batch(() => {
    for (let row = 0; row < hot.countRows(); row++) {
      for (let col = 0; col < hot.countCols(); col++) {
        detectCell(hot, row, col);
      }
    }

    hot.render();
  });
}

function resetTypes(hot: Handsontable): void {
  hot.batch(() => {
    for (let row = 0; row < hot.countRows(); row++) {
      for (let col = 0; col < hot.countCols(); col++) {
        const cellMeta = hot.getCellMetaTransient(row, col);
        const type = cellMeta.type ?? 'text';

        // Cells that opted out of detection keep their type.
        if (cellMeta.autoDetect !== false) {
          if (type !== 'text' && type in typeSettings) {
            applyType(hot, row, col, 'text');
          }

          clearNumericResidue(hot, row, col);
        }
      }
    }

    hot.render();
  });
}

/* start:skip-in-preview */
const data = [
  {
    part: 'Lunar Core',
    partNo: '0042',
    quantity: '12',
    unitCost: '350.50',
    restock: '2026-08-15',
    notes: 'Ships in crates',
  },
  {
    part: 'Zero Thrusters',
    partNo: '0107',
    quantity: '8',
    unitCost: '-45.25',
    restock: '2026-11-02',
    notes: '67',
  },
  {
    part: 'Orbital Relay',
    partNo: '0215',
    quantity: '3.5e2',
    unitCost: '.75',
    restock: '2026-02-31',
    notes: 'Check the restock date',
  },
  {
    part: 'Dome Shelter',
    partNo: '0388',
    quantity: 'n/a',
    unitCost: '1000000',
    restock: '2027-01-25',
    notes: ' 67',
  },
];
/* end:skip-in-preview */

const hotSettings: GridSettings = {
  colHeaders: ['Part', 'Part no.', 'Quantity', 'Unit cost', 'Restock date', 'Notes'],
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  headerClassName: 'htLeft',
  afterChange(this: Handsontable, changes, source) {
    detectChanged(this, changes, source);
  },
  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/
};

const hotRef = useTemplateRef<InstanceType<typeof HotTable>>('hotRef');

// The wrapper types `hotInstance` loosely, so narrow it to the Handsontable instance.
const getHot = () => hotRef.value!.hotInstance as unknown as Handsontable;

const detect = () => detectAll(getHot());
const reset = () => resetTypes(getHot());
</script>
<template>
  <div>
    <div class="example-controls-container">
      <div class="controls">
        <button type="button" @click="detect">Detect types</button>
        <button type="button" @click="reset">Reset to text</button>
      </div>
    </div>
    <HotTable ref="hotRef" :data="data" :settings="hotSettings">
      <HotColumn data="part" :width="140" />
      <!-- Part numbers keep their leading zeros, so this column opts out of detection. -->
      <HotColumn data="partNo" :width="100" :settings="{ autoDetect: false }" />
      <HotColumn data="quantity" :width="100" />
      <HotColumn data="unitCost" :width="110" />
      <HotColumn data="restock" :width="130" />
      <HotColumn data="notes" :width="200" />
    </HotTable>
  </div>
</template>
