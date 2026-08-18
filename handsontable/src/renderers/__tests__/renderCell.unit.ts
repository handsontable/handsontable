import { formatCellValue, renderCell } from '../renderCell';
import { baseRenderer, type BaseRenderer } from '../baseRenderer';
import { textRenderer } from '../textRenderer';
import type { CellProperties } from '../../settings';

/**
 * A minimal cell meta object. The helpers only touch `valueFormatter` and
 * `_isBaseRendererCalled`, so nothing else needs to be real.
 *
 * @param {object} overrides Extra meta properties.
 * @returns {object}
 */
function createCellProperties(overrides: Record<string, unknown> = {}): CellProperties {
  return overrides as CellProperties;
}

/**
 * The argument tuple every renderer receives, with a real TD and a Handsontable stand-in that
 * only resolves the base renderer — all that `renderCell` needs from the instance.
 *
 * @param {object} cellProperties The cell meta object.
 * @returns {Array}
 */
function createRendererArgs(cellProperties: CellProperties): Parameters<BaseRenderer> {
  const hot = {
    getCellRenderer: (meta: { renderer?: unknown }) => (
      meta && meta.renderer === 'base' ? baseRenderer : textRenderer
    ),
  };

  return [
    hot as never,
    document.createElement('td'),
    0,
    0,
    0,
    'A1',
    cellProperties,
  ];
}

describe('formatCellValue', () => {
  it('should return the value untouched when neither formatter is defined', () => {
    expect(formatCellValue('1234.5', createCellProperties(), textRenderer)).toBe('1234.5');
  });

  it('should apply the cell-level valueFormatter', () => {
    const cellProperties = createCellProperties({
      valueFormatter: (value: unknown) => `${value} formatted`,
    });

    expect(formatCellValue('1234.5', cellProperties, textRenderer)).toBe('1234.5 formatted');
  });

  it('should apply the renderer valueFormatter static when the cell defines none', () => {
    const renderer = Object.assign(
      (...args: Parameters<BaseRenderer>) => textRenderer(...args),
      { valueFormatter: (value: unknown) => `${value} via static` }
    );

    expect(formatCellValue('1234.5', createCellProperties(), renderer)).toBe('1234.5 via static');
  });

  it('should prefer the cell-level valueFormatter over the renderer static', () => {
    const renderer = Object.assign(
      (...args: Parameters<BaseRenderer>) => textRenderer(...args),
      { valueFormatter: (value: unknown) => `${value} via static` }
    );
    const cellProperties = createCellProperties({
      valueFormatter: (value: unknown) => `${value} via cell`,
    });

    expect(formatCellValue('1234.5', cellProperties, renderer)).toBe('1234.5 via cell');
  });

  it('should call the renderer static with the cell properties as `this` and as the second argument', () => {
    const cellProperties = createCellProperties({ numericFormat: { style: 'percent' } });
    let receivedThis: unknown;
    let receivedMeta: unknown;
    const renderer = Object.assign(
      (...args: Parameters<BaseRenderer>) => textRenderer(...args),
      {
        valueFormatter(this: unknown, value: unknown, meta: unknown) {
          receivedThis = this;
          receivedMeta = meta;

          return value;
        },
      }
    );

    formatCellValue('1234.5', cellProperties, renderer);

    expect(receivedThis).toBe(cellProperties);
    expect(receivedMeta).toBe(cellProperties);
  });
});

describe('renderCell', () => {
  it('should run the base renderer when the cell renderer did not chain it', () => {
    const cellProperties = createCellProperties({ className: 'my-big-font' });
    const rendererArgs = createRendererArgs(cellProperties);

    renderCell(textRenderer, rendererArgs);

    expect(rendererArgs[1].classList.contains('my-big-font')).toBe(true);
  });

  it('should not run the base renderer twice when the cell renderer already chained it', () => {
    const cellProperties = createCellProperties({ className: 'my-big-font' });
    const rendererArgs = createRendererArgs(cellProperties);
    let baseCalls = 0;

    (rendererArgs[0] as { getCellRenderer: unknown }).getCellRenderer = (meta: { renderer?: unknown }) => {
      if (meta && meta.renderer === 'base') {
        baseCalls += 1;

        return baseRenderer;
      }

      return textRenderer;
    };

    renderCell((...args) => baseRenderer(...args), rendererArgs);

    expect(baseCalls).toBe(0);
  });

  it('should reset the chaining flag so the next draw re-runs the base renderer', () => {
    const cellProperties = createCellProperties({ className: 'my-big-font' });

    renderCell(textRenderer, createRendererArgs(cellProperties));

    expect(cellProperties._isBaseRendererCalled).toBe(false);
  });

  it('should reset the chaining flag even when the cell renderer throws after chaining', () => {
    // The flag lives on the shared cell meta. A renderer that chains the base renderer and THEN
    // throws must not leave the flag set — the next real draw would skip the base renderer and
    // silently drop the cell's classes.
    const cellProperties = createCellProperties({ className: 'my-big-font' });
    const throwingRenderer = (...args: Parameters<BaseRenderer>) => {
      baseRenderer(...args);
      throw new Error('renderer failure');
    };

    expect(() => renderCell(throwingRenderer, createRendererArgs(cellProperties)))
      .toThrow('renderer failure');
    expect(cellProperties._isBaseRendererCalled).toBe(false);
  });
});
