// pageHolder.ts
import { Page } from '@playwright/test';

class PageHolder {
  private static instance: PageHolder;
  private page: Page | null = null;

  // eslint-disable-next-line no-useless-constructor, no-empty-function
  private constructor() {}

  static getInstance(): PageHolder {
    if (!PageHolder.instance) {
      PageHolder.instance = new PageHolder();
    }

    return PageHolder.instance;
  }

  setPage(page: Page) {
    this.page = page;
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error('Page has not been set. Please call setPage(page) before calling getPage().');
    }

    return this.page;
  }
}

export default PageHolder;
