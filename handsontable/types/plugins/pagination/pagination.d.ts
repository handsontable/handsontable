import Core from '../../core';
import { BasePlugin } from '../base';

export interface DetailedSettings {
  pageSize: number;
  pageSizeList: number[];
  initialPage: number;
  autoPageSize: boolean;
  showPageSize: boolean;
  showCounter: boolean;
  showNavigation: boolean;
}

export type Settings = boolean | DetailedSettings;

type PaginationData = {
  currentPage: number,
  totalPages: number,
  pageSize: number,
  pageSizeList: number[],
  numberOfRenderedRows: number,
  firstVisibleRow: number,
  lastVisibleRow: number,
}

export class Pagination extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;

  getPaginationData(): PaginationData;
  setPage(pageNumber: number): void;
  setPageSize(pageSize: number): void;
  nextPage(): void;
  prevPage(): void;
  firstPage(): void;
  lastPage(): void;
  hasPreviousPage(): boolean;
  hasNextPage(): boolean;
  getCurrentPageData(): any[];
  showPageSizeSection(): void;
  hidePageSizeSection(): void;
  showPageCounterSection(): void;
  hidePageCounterSection(): void;
  showPageNavigationSection(): void;
  hidePageNavigationSection(): void;
}
