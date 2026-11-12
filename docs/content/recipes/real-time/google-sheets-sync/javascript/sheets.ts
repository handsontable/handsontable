import { SHEET_NAME, SPREADSHEET_ID } from './config';

export type Cell = string | number | boolean;

const API = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SPREADSHEET_ID)}`;
const MAX_TRIES = 5;

let accessToken = '';
let sheetId: number | null = null;
// Request timestamps from the last minute, for the quota readout.
const requestLog: number[] = [];

export class SessionExpiredError extends Error {}

// A write that hit the quota (429) or a server error (5xx). Run the whole task again with `retrying`.
export class RetryableError extends Error {}

export function setAccessToken(token: string) {
  accessToken = token;
}

export function requestsLastMinute() {
  const cutoff = Date.now() - 60_000;

  while (requestLog.length > 0 && requestLog[0] < cutoff) {
    requestLog.shift();
  }

  return requestLog.length;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Truncated exponential backoff with jitter, as Google recommends: about 1, 2, 4, and 8 seconds.
const backoff = (attempt: number) => Math.min(2 ** attempt * 1000 + Math.random() * 1000, 32_000);

// Every Sheets API call goes through here. A read that hits the quota (429) or a server error
// (5xx) waits and tries again. A write doesn't: it addresses rows by number, and rows can move
// in the sheet while it waits, so it throws RetryableError instead.
async function sheetsFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isRead = (init.method ?? 'GET') === 'GET';

  for (let attempt = 0; ; attempt++) {
    requestLog.push(Date.now());

    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    if (response.status === 401) {
      throw new SessionExpiredError('Your Google session expired. Sign in again.');
    }

    if (response.status === 429 || response.status >= 500) {
      if (!isRead) {
        throw new RetryableError(`Sheets API error ${response.status}`);
      }

      if (attempt < MAX_TRIES - 1) {
        await sleep(backoff(attempt));
        continue;
      }
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      throw new Error(body?.error?.message ?? `Sheets API error ${response.status}`);
    }

    return response.json() as Promise<T>;
  }
}

// Runs a write task, and runs it again with backoff when a write in it throws RetryableError. The
// task reads the sheet before it writes, so each attempt finds the rows where they are now.
export async function retrying(task: () => Promise<void>) {
  for (let attempt = 0; ; attempt++) {
    try {
      await task();

      return;
    } catch (error) {
      if (!(error instanceof RetryableError) || attempt >= MAX_TRIES - 1) {
        throw error;
      }

      await sleep(backoff(attempt));
    }
  }
}

// 'Sheet1' -> "'Sheet1'": quoting makes names with spaces or apostrophes safe in a range.
const quotedSheet = `'${SHEET_NAME.replace(/'/g, "''")}'`;

// 0 -> A, 25 -> Z, 26 -> AA.
function columnLetter(index: number): string {
  let letters = '';

  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters;
  }

  return letters;
}

// Reads the whole tab. UNFORMATTED_VALUE returns numbers as numbers; FORMATTED_STRING
// returns dates as the text the sheet shows instead of serial numbers.
export async function readSheet(): Promise<Cell[][]> {
  const range = encodeURIComponent(quotedSheet);

  try {
    const result = await sheetsFetch<{ values?: Cell[][] }>(
      `/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
    );

    return result.values ?? [];
  } catch (error) {
    // A tab that doesn't exist comes back as "Unable to parse range". Name the tabs instead.
    if (error instanceof Error && error.message.startsWith('Unable to parse range')) {
      const tabs = await listTabs();

      throw new Error(`No tab named "${SHEET_NAME}". Tabs in this spreadsheet: ${tabs.map(({ title }) => title).join(', ')}.`);
    }

    throw error;
  }
}

// Writes single cells in one atomic request. `sheetRow` is the 1-based row in the sheet.
// RAW stores each value exactly as sent: text that starts with `=` stays text and never
// becomes a formula.
export async function writeCells(cells: { sheetRow: number; column: number; value: Cell }[]) {
  if (cells.length === 0) {
    return;
  }

  await sheetsFetch('/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: cells.map(({ sheetRow, column, value }) => ({
        range: `${quotedSheet}!${columnLetter(column)}${sheetRow}`,
        values: [[value]],
      })),
    }),
  });
}

// Adds rows after the table that starts at A1. A blank row ends that table, so rows can land
// above it instead of at the bottom; the sync matches rows by ID, so that is fine.
export async function appendRows(rows: Cell[][]) {
  if (rows.length === 0) {
    return;
  }

  const range = encodeURIComponent(`${quotedSheet}!A1`);

  await sheetsFetch(`/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ values: rows }),
  });
}

// The spreadsheet's tabs, with the numeric IDs the values API doesn't use.
async function listTabs() {
  const result = await sheetsFetch<{ sheets: { properties: { sheetId: number; title: string } }[] }>(
    '?fields=sheets.properties(sheetId,title)',
  );

  return result.sheets.map(({ properties }) => properties);
}

// Deleting rows needs the tab's numeric ID.
async function getSheetId(): Promise<number> {
  if (sheetId === null) {
    const tab = (await listTabs()).find(({ title }) => title === SHEET_NAME);

    if (!tab) {
      throw new Error(`No tab named "${SHEET_NAME}" in the spreadsheet.`);
    }

    sheetId = tab.sheetId;
  }

  return sheetId;
}

// Deletes whole rows (1-based sheet row numbers). Bottom-up, so earlier deletions don't
// shift the rows still to be deleted.
export async function deleteRows(sheetRows: number[]) {
  if (sheetRows.length === 0) {
    return;
  }

  const id = await getSheetId();

  await sheetsFetch(':batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      requests: [...sheetRows].sort((a, b) => b - a).map((row) => ({
        deleteDimension: { range: { sheetId: id, dimension: 'ROWS', startIndex: row - 1, endIndex: row } },
      })),
    }),
  });
}
