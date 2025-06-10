import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import Handsontable from 'handsontable';
import {HotTableModule, GridSettings} from '@handsontable/angular-wrapper';

@Component({
    standalone: true,
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [HotTableModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent {
    initialData: Handsontable.CellValue[][] = [
        ['', 'Tesla', 'Volvo', 'Toyota', 'Ford'],
        ['2019', 10, 11, 12, 13],
        ['2020', 20, 11, 14, 13],
        ['2021', 30, 15, 12, 13]
    ];
    hotSettings: GridSettings = {
        colHeaders: true,
        rowHeaders: true,
        licenseKey: 'non-commercial-and-evaluation'
    };
}
