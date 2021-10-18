import { BasePlugin } from '../base';

export class ExportFile extends BasePlugin {
  constructor(hotInstance: any);
  isEnabled(): boolean;
  exportAsString(format: string, options?: object): string;
  exportAsBlob(format: string, options?: object): Blob;
  downloadFile(format: string, options?: object): void;
}
