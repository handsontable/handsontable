export class ViewportColumnsCalculator {
  count: number;
  startColumn: number | null;
  endColumn: number | null;
  startPosition: number | null;
  startRow?: number;
  endRow?: number;
  stretchAllRatio: number;
  stretchLastWidth: number;
  stretch: 'none' | 'all' | 'last';
  totalTargetWidth: number;
  needVerifyLastColumnWidth: boolean;
  stretchAllColumnsWidth: number[];

  calculate(): void;
  refreshStretching(totalWidth: number): void;
  getStretchedColumnWidth(column: number, baseWidth: number): number | null;
}
