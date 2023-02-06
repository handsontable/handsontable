/* eslint-disable */
const puppeteer = require('puppeteer');

describe('Smoke check', () => {
  let browser = null;
  let page = null;
  const BASE_URL = process.env.TEST_URL || 'http://localhost:8080';

  beforeEach(async () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000;
    // browser = await puppeteer.launch({ headless: false, slowMo: 250, devtools: true });
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto(BASE_URL);
  }, 90000);

  afterEach(async () => {
    await browser.close();
  });

  it('should render Handsontable', async () => {
    const hotCell = await page.$('.handsontable td');

    // assertion
    await expect(hotCell).toBeTruthy();
  });
});
