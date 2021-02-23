import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Input,
} from '@angular/core';
import { HotTableComponent } from './hot-table.component';
import Handsontable from 'handsontable';

@Component({
  selector: 'hot-column',
  template: '',
})
export class HotColumnComponent implements OnInit, OnChanges, OnDestroy {
  private firstRun = true;
  // handsontable column options
  @Input() allowEmpty: Handsontable.ColumnSettings['allowEmpty'];
  @Input() allowHtml: Handsontable.ColumnSettings['allowHtml'];
  @Input() allowInvalid: Handsontable.ColumnSettings['allowInvalid'];
  @Input() checkedTemplate: Handsontable.ColumnSettings['checkedTemplate'];
  @Input() className: Handsontable.ColumnSettings['className'];
  @Input() columnSorting: Handsontable.ColumnSettings['columnSorting'];
  @Input() colWidths: Handsontable.ColumnSettings['colWidths'];
  @Input() commentedCellClassName: Handsontable.ColumnSettings['commentedCellClassName'];
  @Input() copyable: Handsontable.ColumnSettings['copyable'];
  @Input() correctFormat: Handsontable.ColumnSettings['correctFormat'];
  @Input() data: Handsontable.ColumnSettings['data'];
  @Input() dateFormat: Handsontable.ColumnSettings['dateFormat'];
  @Input() defaultDate: Handsontable.ColumnSettings['defaultDate'];
  @Input() editor: Handsontable.ColumnSettings['editor'];
  @Input() filteringCaseSensitive: Handsontable.ColumnSettings['filteringCaseSensitive'];
  @Input() invalidCellClassName: Handsontable.ColumnSettings['invalidCellClassName'];
  @Input() label: Handsontable.ColumnSettings['label'];
  @Input() language: Handsontable.ColumnSettings['language'];
  @Input() noWordWrapClassName: Handsontable.ColumnSettings['noWordWrapClassName'];
  @Input() numericFormat: Handsontable.ColumnSettings['numericFormat'];
  @Input() placeholder: Handsontable.ColumnSettings['placeholder'];
  @Input() placeholderCellClassName: Handsontable.ColumnSettings['placeholderCellClassName'];
  @Input() readOnly: Handsontable.ColumnSettings['readOnly'];
  @Input() readOnlyCellClassName: Handsontable.ColumnSettings['readOnlyCellClassName'];
  @Input() renderer: Handsontable.ColumnSettings['renderer'];
  @Input() selectOptions: Handsontable.ColumnSettings['selectOptions'];
  @Input() skipColumnOnPaste: Handsontable.ColumnSettings['skipColumnOnPaste'];
  @Input() sortByRelevance: Handsontable.ColumnSettings['sortByRelevance'];
  @Input() source: Handsontable.ColumnSettings['source'];
  @Input() strict: Handsontable.ColumnSettings['strict'];
  @Input() title: Handsontable.ColumnSettings['title'];
  @Input() trimDropdown: Handsontable.ColumnSettings['trimDropdown'];
  @Input() type: Handsontable.ColumnSettings['type'];
  @Input() uncheckedTemplate: Handsontable.ColumnSettings['uncheckedTemplate'];
  @Input() validator: Handsontable.ColumnSettings['validator'];
  @Input() visibleRows: Handsontable.ColumnSettings['visibleRows'];
  @Input() width: Handsontable.ColumnSettings['width'];
  @Input() wordWrap: Handsontable.ColumnSettings['wordWrap'];

  constructor(private parentComponent: HotTableComponent) {}

  ngOnInit(): void {
    this.firstRun = false;
    this.parentComponent.addColumn(this);
  }

  ngOnChanges(): void {
    if (this.firstRun) {
      return;
    }

    this.parentComponent.onAfterColumnsChange();
  }

  ngOnDestroy(): void {
    this.parentComponent.removeColumn(this);
  }
}
