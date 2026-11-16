// Values come from .env.local. The OAuth client ID identifies your
// app to Google; it is not a secret, and the browser needs it.
export const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
export const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID as string;
export const SHEET_NAME = (import.meta.env.VITE_SHEET_NAME as string | undefined) ?? 'Sheet1';

// The column that holds each row's stable ID. Rows are matched by this value, never by
// position, so sorting or inserting rows in Google Sheets can't send an edit to the wrong row.
export const ID_HEADER = 'id';

// 12 reads a minute, well under the Sheets API limit of 60 per user per minute.
export const POLL_MS = 5_000;
