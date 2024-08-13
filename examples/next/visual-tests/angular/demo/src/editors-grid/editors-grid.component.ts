import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'editors-grid',
  templateUrl: './editors-grid.component.html',
  styleUrls: ['./editors-grid.scss'],
})
export class EditorsGridComponent {
  dataset = [
    { brand: 'Mercedes', model: 'A 160', year: 2017, price_usd: 7000, sell_date: '01/01/2021' },
    { brand: 'Citroen', model: 'C4', year: 2018, price_usd: 8330, sell_date: '04/12/2020' },
    { brand: 'Audi', model: 'A4', year: 2019, price_usd: 33900, sell_date: '11/04/2022' },
    { brand: 'Opel', model: 'Astra', year: 2020, price_usd: 5000, sell_date: '21/08/2024' },
    { brand: 'BMW', model: '320i', year: 2021, price_usd: 30500, sell_date: '03/06/2021' },
  ];
}
