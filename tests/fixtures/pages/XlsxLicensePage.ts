import { inflateRawSync } from 'node:zlib';
import { type Page } from '@playwright/test';
import ExcelJS from 'exceljs';
import { awaitBundle, assertKnownBundle, type Bundle } from '../bundle';

/**
 * The instant the page clock is pinned to before the fixture loads. The license key is read when a
 * grid is constructed, so a fixed instant keeps every key of `fixtures/xlsxLicenseKeys.ts` (valid to
 * 2027-08-12, 60-day notice) out of its notice, grace and lock periods whatever day the suite runs.
 */
export const LICENSE_INSTANT = '2026-10-30T12:00:00Z';

/**
 * The in-page API `xlsx-license.html` installs as `window.htLicense`.
 */
interface HtLicense {
  create(licenseKey: string, overrides?: Record<string, unknown>): void;
  exportBytes(options?: Record<string, unknown>): Promise<number[]>;
  importBytes(bytes: number[], options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  warnings(): string[];
}

/**
 * Page object for the xlsx license fixture (`xlsx-license.html`): no grid on load; `create(key)`
 * builds a richly configured source grid and an empty import target under one license key, and the
 * other helpers export, import and read the console in memory (no download).
 */
export class XlsxLicensePage {
  readonly page: Page;
  readonly theme: string;
  readonly bundle: Bundle;
  readonly engine: 'native' | 'exceljs';

  constructor(page: Page, theme = 'main', bundle: Bundle = 'umd', engine: 'native' | 'exceljs' = 'native') {
    assertKnownBundle(bundle, 'XlsxLicensePage(page, theme, bundle, engine)');
    this.page = page;
    this.theme = theme;
    this.bundle = bundle;
    this.engine = engine;
  }

  /** Pin the clock, open the fixture, and wait for the bundle. */
  async goto(): Promise<void> {
    await this.page.clock.setFixedTime(new Date(LICENSE_INSTANT));
    await this.page.goto(
      `/tests/fixtures/demo/xlsx-license.html?theme=${this.theme}&bundle=${this.bundle}&engine=${this.engine}`);
    await awaitBundle(this.page);
  }

  /**
   * (Re)build the source and target grids under `key`. `overrides` is merged over the source
   * grid's settings.
   */
  async create(key: string, overrides: Record<string, unknown> = {}): Promise<void> {
    await this.page.evaluate(([licenseKey, settings]) => {
      (window as unknown as { htLicense: HtLicense }).htLicense.create(licenseKey, settings);
    }, [key, overrides] as const);
  }

  /**
   * Export the source grid to xlsx (`exportAsBlobAsync('xlsx', options)`) and return the bytes.
   * Rejects with the in-page error message when the export throws.
   */
  async exportBytes(options: Record<string, unknown> = {}): Promise<Buffer> {
    const bytes = await this.page.evaluate(
      exportOptions => (window as unknown as { htLicense: HtLicense }).htLicense.exportBytes(exportOptions),
      options);

    return Buffer.from(bytes);
  }

  /** Export the source grid and read the file back with ExcelJS in Node. */
  async exportWorkbook(options: Record<string, unknown> = {}): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(await this.exportBytes(options));

    return workbook;
  }

  /**
   * The XML of the first worksheet (`xl/worksheets/sheet1.xml`) of an xlsx file, unzipped by hand
   * from the central directory, so the bytes are read exactly as the engine wrote them.
   */
  sheetXml(bytes: Buffer): string {
    return zipEntry(bytes, 'xl/worksheets/sheet1.xml').toString('utf8');
  }

  /**
   * Import `bytes` into the target grid (`importFromArrayBuffer('xlsx', …, options)`) and return the
   * result's own enumerable properties. Rejects with the in-page error message when the import throws.
   */
  async importBytes(bytes: Buffer, options: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return this.page.evaluate(
      ([data, importOptions]) => (window as unknown as { htLicense: HtLicense }).htLicense.importBytes(data, importOptions),
      [Array.from(bytes), options] as const);
  }

  /** The console.warn messages the page logged since the last `create()` began. */
  async warnings(): Promise<string[]> {
    return this.page.evaluate(() => (window as unknown as { htLicense: HtLicense }).htLicense.warnings());
  }

  /**
   * The labels of the Export submenu, as the user sees them: right-click A1 (row 0 is frozen, so the
   * copy in the top overlay), hover Export, and read the submenu. `[]` when the menu has no Export
   * item. Closes the whole menu again.
   */
  async exportMenuItems(): Promise<string[]> {
    await this.page.locator('[data-testid="source"] .ht_clone_top').getByTestId('source-0-0').click({ button: 'right' });

    const menu = this.page.locator('.htContextMenu:not(.htContextMenuSub_Export)');

    await menu.locator('td').first().waitFor();

    const exportItem = menu.locator('td', { hasText: 'Export' });
    let labels: string[] = [];

    if (await exportItem.count() > 0) {
      await exportItem.hover();

      const subMenu = this.page.locator('.htContextMenuSub_Export');

      await subMenu.locator('td').first().waitFor();
      labels = (await subMenu.locator('.ht_master td').allTextContents()).map(label => label.trim());
    }

    // Escape walks back one level at a time, so the whole menu is closed through the plugin.
    await this.page.evaluate(() => {
      (window as unknown as { hot: { getPlugin(name: string): { close(): void } } }).hot.getPlugin('contextMenu').close();
    });
    await this.page.locator('.htContextMenu').first().waitFor({ state: 'hidden' });

    return labels;
  }
}

/**
 * One entry of a ZIP archive, located through the central directory and inflated with `node:zlib`.
 */
function zipEntry(zip: Buffer, name: string): Buffer {
  const endOfCentralDirectory = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));

  if (endOfCentralDirectory < 0) {
    throw new Error('Not a ZIP archive: no end of central directory record.');
  }

  const entries = zip.readUInt16LE(endOfCentralDirectory + 10);
  let offset = zip.readUInt32LE(endOfCentralDirectory + 16);

  for (let i = 0; i < entries; i++) {
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localHeader = zip.readUInt32LE(offset + 42);
    const entryName = zip.toString('utf8', offset + 46, offset + 46 + nameLength);

    if (entryName === name) {
      const dataStart = localHeader + 30 + zip.readUInt16LE(localHeader + 26) + zip.readUInt16LE(localHeader + 28);
      const data = zip.subarray(dataStart, dataStart + compressedSize);

      return method === 0 ? Buffer.from(data) : inflateRawSync(data);
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  throw new Error(`The archive has no ${name} entry.`);
}
