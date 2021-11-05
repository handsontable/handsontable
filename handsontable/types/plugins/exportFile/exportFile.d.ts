import Core from '../../core';
import { BasePlugin } from '../base';

export type Settings = boolean;

export class ExportFile extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;
  exportAsString(format: string, options?: object): string;
  exportAsBlob(format: string, options?: object): Blob;
  downloadFile(format: string, options?: object): void;
}
