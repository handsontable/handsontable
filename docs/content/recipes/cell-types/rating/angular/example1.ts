/* file: app.component.ts */
import { Component, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  GridSettings,
  HotCellEditorAdvancedComponent,
  HotCellRendererAdvancedComponent,
  KeyboardShortcutConfig,
} from '@handsontable/angular-wrapper';

/* start:skip-in-preview */
const starSvg =
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

const inputData = [
  { product: 'Dashboard Pro', category: 'Analytics', rating: 5, reviews: 342, price: 49 },
  { product: 'Form Builder', category: 'Tools', rating: 4, reviews: 218, price: 29 },
  { product: 'Chart Engine', category: 'Analytics', rating: 3, reviews: 156, price: 39 },
  { product: 'Auth Module', category: 'Security', rating: 5, reviews: 89, price: 19 },
  { product: 'File Manager', category: 'Storage', rating: 2, reviews: 64, price: 15 },
  { product: 'Email Service', category: 'Communication', rating: 4, reviews: 275, price: 25 },
  { product: 'Search Index', category: 'Tools', rating: 1, reviews: 31, price: 35 },
  { product: 'Cache Layer', category: 'Infra', rating: 4, reviews: 112, price: 20 },
];
/* end:skip-in-preview */

@Component({
  selector: 'example1-star-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rating-cell">
      @for (star of stars; track $index) {
        <span class="rating-star" [class.active]="$index < value" [innerHTML]="starSvgMarkup"></span>
      }
    </div>`,
  styleUrls: ['./example1.css'],
  standalone: false,
})
export class StarRendererComponent extends HotCellRendererAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup: SafeHtml = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);
}

@Component({
  selector: 'example1-star-editor',
  standalone: false,
  template: `
    <div class="rating-editor" (mouseover)="onMouseOver($event)" (mousedown)="onMouseDown()">
      @for (star of stars; track $index) {
        <span
          [attr.data-value]="$index + 1"
          class="rating-star"
          [class.active]="$index < getValue()"
          [class.current]="isCurrentStar($index)"
          [innerHTML]="starSvgMarkup"
        ></span>
      }
    </div>
  `,
  styleUrls: ['./example1.css'],
})
export class StarEditorComponent extends HotCellEditorAdvancedComponent<number> {
  readonly stars = Array(5);
  readonly starSvgMarkup: SafeHtml = inject(DomSanitizer).bypassSecurityTrustHtml(starSvg);

  isCurrentStar(index: number): boolean {
    return (index + 1) === parseInt(this.getValue()?.toString() ?? '0', 10);
  }

  override shortcuts?: KeyboardShortcutConfig[] = [
    {
      keys: [['1'], ['2'], ['3'], ['4'], ['5']],
      callback: (_editor, event) => {
        this.setValue(parseInt((event as KeyboardEvent).key, 10));
      },
    },
    {
      keys: [['ArrowRight']],
      callback: (_editor, _event) => {
        if (parseInt(this.getValue()?.toString() ?? '0') < 5) {
          this.setValue(parseInt(this.getValue()?.toString() ?? '0') + 1);
        }
      },
    },
    {
      keys: [['ArrowLeft']],
      callback: (_editor, _event) => {
        if (parseInt(this.getValue()?.toString() ?? '0') > 1) {
          this.setValue(parseInt(this.getValue()?.toString() ?? '0') - 1);
        }
      },
    },
  ];

  private readonly cdr = inject(ChangeDetectorRef);

  onMouseOver(event: MouseEvent): void {
    const star = (event.target as HTMLElement).closest('.rating-star') as HTMLElement | null;

    if (
      star?.dataset['value'] &&
      parseInt(this.getValue()?.toString() ?? '0') !== parseInt(star.dataset['value'], 10)
    ) {
      this.setValue(parseInt(star.dataset['value'], 10));
      this.cdr.detectChanges();
    }
  }

  onMouseDown(): void {
    this.finishEdit.emit();
  }
}

@Component({
  selector: 'example1-rating',
  standalone: false,
  template: `<div><hot-table [data]="data" [settings]="gridSettings"></hot-table></div>`,
})
export class Example1RatingComponent {
  readonly data = inputData;

  readonly gridSettings: GridSettings = {
    autoRowSize: true,
    rowHeaders: true,
    autoWrapRow: true,
    height: 'auto',
    width: '100%',
    headerClassName: 'htLeft',
    colHeaders: ['Product', 'Category', 'Rating', 'Reviews', 'Price'],
    columns: [
      { data: 'product', type: 'text', width: 240 },
      { data: 'category', type: 'text', width: 120 },
      { data: 'rating', width: 150, renderer: StarRendererComponent, editor: StarEditorComponent },
      { data: 'reviews', type: 'numeric', width: 80 },
      { data: 'price', type: 'numeric', width: 80 },
    ],
  };
}
/* end-file */

/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';
/* start:skip-in-compilation */
import { Example1RatingComponent, StarRendererComponent, StarEditorComponent } from './app.component';
/* end:skip-in-compilation */

registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1RatingComponent, StarRendererComponent, StarEditorComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1RatingComponent],
})
export class AppModule {}
/* end-file */
