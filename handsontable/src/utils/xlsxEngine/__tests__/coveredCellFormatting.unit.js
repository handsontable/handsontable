/**
 * @jest-environment node
 */
import { coveredCellFormatting } from '../coveredCellFormatting';

function cell(fields = {}) {
  return {
    value: null, formula: null, numFmt: null, style: null, validation: null, locked: null, comment: null, ...fields,
  };
}

function style(fields = {}) {
  return {
    alignment: null, font: null, fill: null, border: null, ...fields,
  };
}

function side(argb) {
  return { style: 'thin', color: { argb } };
}

function solid(argb) {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

describe('coveredCellFormatting', () => {
  it('should give a covered cell with no formatting of its own the master\'s whole formatting', () => {
    const master = cell({ numFmt: '0.00', locked: false, style: style({ fill: solid('AA') }) });

    expect(coveredCellFormatting(master, null)).toEqual({ numFmt: '0.00', style: master.style, locked: false });
    expect(coveredCellFormatting(master, cell())).toEqual({ numFmt: '0.00', style: master.style, locked: false });
  });

  it('should let the master win a side both set, and keep the covered cell\'s other sides', () => {
    const master = cell({ style: style({ border: { top: side('AA'), right: side('MM') } }) });
    const covered = cell({ numFmt: '0.00', style: style({ border: { right: side('CC'), bottom: side('CC') } }) });
    const { style: result } = coveredCellFormatting(master, covered);

    expect(result.border.right.color.argb).toBe('MM');
    expect(result.border.bottom.color.argb).toBe('CC');
    expect(result.border.top.color.argb).toBe('AA');
  });

  it('should let the master\'s fill win over the covered cell\'s own, and keep the own one when the master has none', () => {
    const covered = cell({ numFmt: '0.00', style: style({ fill: solid('CC') }) });

    expect(coveredCellFormatting(cell({ style: style({ fill: solid('MM') }) }), covered).style.fill)
      .toEqual(solid('MM'));
    expect(coveredCellFormatting(cell({ style: style({ border: { top: side('AA') } }) }), covered).style.fill)
      .toEqual(solid('CC'));
  });

  it('should keep a formatted covered cell\'s own number format, lock, alignment and font', () => {
    const master = cell({
      numFmt: '0.000', locked: true, style: style({ alignment: { horizontal: 'left' }, font: { bold: true } }),
    });
    const covered = cell({
      numFmt: 'yyyy-mm-dd', locked: false, style: style({ alignment: { horizontal: 'right' }, font: { italic: true } }),
    });

    expect(coveredCellFormatting(master, covered)).toEqual({
      numFmt: 'yyyy-mm-dd',
      locked: false,
      style: style({ alignment: { horizontal: 'right' }, font: { italic: true } }),
    });
  });
});
