import Core from '../../core';
import { BasePlugin } from '../base';

type PageSizeOption = number | 'auto';

export interface DetailedSettings {
  pageSize?: PageSizeOption;
  pageSizeList?: Array<PageSizeOption>;
  initialPage?: number;
  showPageSize?: boolean;
  showCounter?: boolean;
  showNavigation?: boolean;
  uiContainer?: HTMLElement;
}

export type Settings = boolean | DetailedSettings;

type PaginationData = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeList: Array<PageSizeOption>;
  autoPageSize: boolean;
  numberOfRenderedRows: number;
  firstVisibleRowIndex: number;
  lastVisibleRowIndex: number;
}

export class Pagination extends BasePlugin {
  constructor(hotInstance: Core);
  isEnabled(): boolean;

  getPaginationData(): PaginationData;
  setPage(pageNumber: number): void;
  resetPage(): void;
  setPageSize(pageSize: PageSizeOption): void;
  resetPageSize(): void;
  resetPagination(): void;
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
