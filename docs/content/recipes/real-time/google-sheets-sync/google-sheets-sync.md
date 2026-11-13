---
type: tutorial
title: Two-way sync with Google Sheets
metaTitle: Two-way sync with Google Sheets | Handsontable DataGrid for JavaScript
description: Put Handsontable DataGrid on top of a Google Sheet. Read it into the grid, write edits back, pick up changes made in Google Sheets, and catch conflicts.
permalink: /recipes/real-time/google-sheets-sync
canonicalUrl: /recipes/real-time/google-sheets-sync
menuTag: new
tags:
  - google sheets
  - google sheets api
  - google identity services
  - oauth
  - two-way sync
  - conflict detection
  - setSourceDataAtCell
  - tutorial
  - recipes
searchCategory: Recipes
category: Real-time & Integrations
---

In this tutorial, you will put a Handsontable DataGrid on top of a Google Sheet without moving the data. The grid reads the sheet, writes the user's edits back, and picks up edits other people make in Google Sheets. The app runs in the browser only: the user signs in with Google, and the grid calls the Google Sheets API directly, with no backend.

<iframe src="https://demos.handsontable.com/embed/264186j4w4/"
  style="width:100%; height: 980px; border:0; border-radius: 4px; overflow:hidden;"
  title="A Handsontable DataGrid in two-way sync with a simulated Google Sheet"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

[**Open in the demo runner**](https://demos.handsontable.com/share/264186j4w4)

The grid above syncs with the sheet next to it. Edit a cell in the grid, and the sheet shows it within a second. Edit the sheet, or select **Colleague edits a cell**, and the grid picks the change up on its next poll. Select **Sort sheet by Product** or **Insert blank row**, then edit the grid: the edit still lands in the right row. The log under the panels lists every API call, and the toolbar counts them against the quota.

**Note:** the demo above simulates the Google Sheets API in the page, so it works without a Google account. The recipe code calls the real API: to run it, you need your own Google Cloud project, OAuth client ID, and spreadsheet, as set up in [Step 1](#step-1-set-up-google-cloud-and-the-sheet).

<script>
  // Keep the embedded demo in the same light/dark mode as this page. The
  // demos.handsontable.com embed wrapper posts { source, ready } when it loads
  // and applies any { source, mode } it receives.
  (() => {
    const SOURCE = 'hot-runner-scheme';
    const ORIGIN = 'https://demos.handsontable.com';
    const mode = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    const frames = () => Array.from(document.querySelectorAll('iframe[src^="' + ORIGIN + '"]'));
    const send = (win) => win && win.postMessage({ source: SOURCE, mode: mode() }, ORIGIN);
    window.addEventListener('message', (event) => {
      if (event.origin === ORIGIN && event.data && event.data.source === SOURCE && event.data.ready) send(event.source);
    });
    new MutationObserver(() => frames().forEach((frame) => send(frame.contentWindow))).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ['data-theme'] },
    );
  })();
</script>

[[toc]]

## Overview

**Difficulty:** Intermediate<br>
**Time:** ~30 minutes<br>
**Stack:** Google Sheets API v4, Google Identity Services, Handsontable, Vite, TypeScript

A grid on top of a shared sheet breaks in predictable ways if it syncs naively:

- Someone sorts the sheet, and the grid's next edit lands in the wrong row.
- Two people edit the same cell, and the later write silently overwrites the earlier one.
- A change from the sheet arrives while the user is typing, and wipes what they typed.
- Every keystroke becomes a request, and the app runs into the API quota.
- A user types `=SUM(A:A)`, and the sheet turns it into a formula.

This recipe handles each of these. Rows are matched by an ID column, never by position. Each edit is checked against the sheet before it's written. Remote changes wait until the editor closes. Edits are batched, and values are written as plain values.

## What you'll build

- A sign-in button that gets a short-lived access token from Google, with no client secret and no server.
- A grid whose columns come from the sheet's first row, with a hidden `id` column.
- Edits in the grid that reach the sheet within a second, in one request per batch.
- Edits in Google Sheets that reach the grid within about 5 seconds.
- Rows added and removed in either place.
- Conflict detection: if someone changed a cell in the sheet after the grid last read it, the grid keeps their value and shows a toast.
- Retries with exponential backoff when Google returns `429 Too Many Requests` or a server error, and a request counter against the quota.

## Before you begin

| Requirement | Version |
|---|---|
| Node.js | 20 or later |
| `handsontable` | 18.1 or later |
| Vite | any current version |
| A Google account | with access to [Google Cloud console](https://console.cloud.google.com/) |

Create the app:

```bash
npm create vite@latest sheets-grid -- --template vanilla-ts
cd sheets-grid
npm install handsontable
```

## Step 1: Set up Google Cloud and the sheet

The browser needs an OAuth client ID to ask the user for access, and the Sheets API must be enabled for the project the ID belongs to.

1. In the Google Cloud console, create a project, or pick an existing one.
2. Go to **APIs & Services** > **Library**, find **Google Sheets API**, and select **Enable**.
3. Go to **APIs & Services** > **OAuth consent screen** (**Google Auth Platform** in newer versions of the console) and configure it. If your Google Workspace allows it, pick the **Internal** user type, so anyone in your organization can sign in. Otherwise pick **External**, keep the app in **Testing** mode, and add each tester's Google account as a test user.
4. Go to **APIs & Services** > **Credentials** > **Create credentials** > **OAuth client ID**. Pick **Web application**, and under **Authorized JavaScript origins** add `http://localhost:5173`, the address Vite serves the app on. The origin must match exactly: `http://127.0.0.1:5173` is a different origin. The token flow needs no redirect URI. Copy the client ID.

Then prepare the sheet:

1. Create a Google Sheet. Put the column names in row 1, and name one column `id`.
2. Give every row a unique value in the `id` column. Any text works, for example `1`, `2`, `3`, or a UUID.
3. Copy the spreadsheet ID from its URL: `https://docs.google.com/spreadsheets/d/<spreadsheet-id>/edit`.

Create `.env.local` in the app folder:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SPREADSHEET_ID=your-spreadsheet-id
VITE_SHEET_NAME=Sheet1
```

The client ID isn't a secret: it identifies your app to Google, and Google only accepts it from the origins you listed. Keep `.env.local` out of version control anyway, so each developer uses their own sheet.

## Step 2: Add the configuration

Create `src/config.ts`:

::: example #config-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/config.ts)

:::

**What's happening:** `ID_HEADER` names the column that identifies rows, and `POLL_MS` sets how often the grid reads the sheet. Every 5 seconds is 12 reads a minute. The Sheets API allows 60 read requests and 60 write requests a minute per user per project, so the grid stays well under the limit even with the extra reads its writes make.

## Step 3: Sign the user in

Create `src/auth.ts`:

::: example #auth-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/auth.ts)

:::

**What's happening:**

- **The token model needs no server.** `initTokenClient` from Google Identity Services opens Google's consent popup and returns an access token to the page. There is no client secret and no refresh token, so nothing sensitive lives in the browser beyond the token itself.
- **Sign-in must come from a click.** Browsers block popups that a page opens on its own, so `signIn` runs in the button's click handler.
- **Ignore the popup warning in the console.** During sign-in, the browser console can log `Cross-Origin-Opener-Policy policy would block the window.closed call`. Google's library checks whether its popup has closed, and the browser blocks that check. Sign-in still works.
- **Tokens expire.** An access token lasts about an hour. When it expires, the API returns `401`, and the app asks the user to sign in again.
- **The `spreadsheets` scope covers every sheet the user can open.** That is what lets the app open a sheet it didn't create. The narrower `drive.file` scope only covers files the app created or the user picked with the Google Picker. See [Production considerations](#production-considerations).

## Step 4: Call the Sheets API

Create `src/sheets.ts`:

::: example #sheets-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/sheets.ts)

:::

**What's happening:**

- **A missing tab is named.** If the spreadsheet has no tab called `VITE_SHEET_NAME`, the API answers `Unable to parse range`. `readSheet` turns that into a message that lists the tabs the spreadsheet does have.
- **One wrapper for every request.** `sheetsFetch` adds the bearer token. A read that gets `429` or a `5xx` response is retried with truncated exponential backoff, as Google recommends: about 1, 2, 4, and 8 seconds, plus random jitter, capped at 32 seconds, and at most five tries. A write isn't retried on its own: it addresses rows by number, and rows can move in the sheet during the wait. It throws `RetryableError`, and `retrying` runs the whole write task again, read included, so each try finds the rows where they are. A `401` throws `SessionExpiredError` instead of retrying.
- **Numbers come back as numbers.** `readSheet` asks for `UNFORMATTED_VALUE`, so a price is `12.5`, not `"$12.50"`, and the grid can sort and edit it as a number. `dateTimeRenderOption=FORMATTED_STRING` returns dates as the text the sheet shows, instead of serial numbers.
- **`RAW` keeps text as text.** `writeCells` sends `valueInputOption: 'RAW'`, so the sheet stores each value exactly as sent. With `USER_ENTERED`, the sheet would parse it the way it parses typing, and a value that starts with `=` would become a formula.
- **One request per batch.** `values:batchUpdate` writes any number of cells in one request, and either all of them are written or none is. It counts as one request against the quota.
- **Appended rows go after the first table Google finds.** `values:append` looks for a table starting at `A1` and inserts the new rows right after it. A blank row ends that table, so in a sheet with a blank row in the middle, a row added in the grid lands above the blank row instead of at the bottom. The sync matches rows by ID, so the position doesn't matter to it.
- **Rows are deleted bottom-up.** Deleting a row shifts every row below it up by one. `deleteRows` sorts the row numbers from the bottom, so each deletion leaves the rows still to delete where they were.
- **Sheet names are quoted.** `quotedSheet` wraps the tab name in single quotes, so a name with a space or an apostrophe still works in a range.

## Step 5: Sync the sheet and the grid

Create `src/sync.ts`:

::: example #sync-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/sync.ts)

:::

**What's happening:**

- **The grid polls.** Google can notify a server about file changes through Drive's `files.watch`, but the notification goes to a public HTTPS endpoint, which a browser-only app doesn't have. So `poll` reads the sheet every `POLL_MS`, and pauses while the browser tab is hidden. If a read fails, for example while the user is offline, the grid shows one toast and keeps polling.
- **Rows are matched by ID.** `applyRemote` compares each sheet row with the grid row that has the same ID. A row that moved in the sheet, because someone sorted it or inserted a row above it, still updates the right grid row. A sheet row with an empty `id` isn't synced. If a row was copied in Google Sheets with its ID, only the first row with that ID syncs, and the grid warns about the copy. `parse` skips blank rows but keeps each row's sheet row number, so a blank row in the middle of the sheet can't shift a write to the row below it.
- **Empty cells are normalized on both sides.** The Sheets API leaves out empty cells at the end of a row, and an empty grid cell is `null`. `parse` pads every row to the header's width, and `normalize` turns `null` and missing cells into `''`. Without this, every untouched empty cell would look like a change.
- **Changed values go in by physical row.** `setSourceDataAtCell` takes physical row indexes, the positions in the `rows` array, so a sort or filter in the grid can't send a value to the wrong row. It takes all of a poll's changes in one call and renders once. The `'sync'` source tells the `afterChange` hook not to send the change back.
- **Added and removed rows replace the data.** When the sheet has rows the grid doesn't, or the other way round, `updateData` loads the new array. Sorting and filtering don't re-run on their own when data changes, so `reapplyView` re-applies them, and new rows land in sorted position.
- **An open editor isn't interrupted.** Setting a cell's source data refreshes the active editor's value, which would wipe what the user is typing. While an editor is open, `applyRemote` skips the round, and the next poll catches up.
- **The grid's own writes aren't undone by a poll.** A read can return before a write reaches the sheet. `pendingCells`, `pendingAppends`, and `pendingDeletes` hold what the grid sent, and `applyRemote` leaves those cells and rows alone until the sheet has them. Each pending cell records when its write finished. A read that started after that is the sheet's current state, so if someone changed the cell in the meantime, their value wins instead of the grid holding on to its own.
- **Edits are batched and checked.** `afterChange` collects a user's edits for 300 ms and remembers each cell's value before the edit, the base. `writeEdits` then reads the sheet once, finds each row's current position by ID, and compares the sheet's value with the base. If they differ, someone changed the cell in Google Sheets after the grid last read it: the grid keeps their value, and the [Notification](@/guides/dialog/notification/notification.md) plugin says so. The other edits go out in one `values:batchUpdate`.
- **New rows get an ID in the grid.** `afterCreateRow` gives each new row a `crypto.randomUUID()` ID and appends it to the sheet. A row that undo brings back keeps its old ID: undo creates the row before it refills it, so `sendNewRows` reads the row in a microtask, once the refill is done. `beforeRemoveRow` reads the IDs of the rows being removed while they still exist, then deletes those rows from the sheet by their current row numbers. If either write fails, the pending entry is dropped, and the next poll puts the grid back to what the sheet holds.
- **Writes run in order.** `enqueueWrite` chains every write on one promise, so a new row reaches the sheet before an edit to that row does.
- **Undo covers the user's own edits.** The sync writes with the `'sync'` source, and `beforeUndoStackChange` keeps those writes off the undo stack, so <kbd>Ctrl</kbd>+<kbd>Z</kbd> can't revert a colleague's change.

## Step 6: Build the grid

Create `src/grid.ts`:

::: example #grid-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/grid.ts)

:::

**What's happening:**

- **The data is arrays, not objects.** Handsontable reads a column's `data` property with dots as a nested path, so a header such as `Unit.price` would bind to the wrong place. The grid keeps each row as an array, uses the column index as the column, and shows the sheet's headers through `colHeaders`.
- **Column types come from the data.** `columnFor` makes a column numeric when every filled cell in it is a number, and text otherwise.
- **The ID stays in the data.** `hiddenColumns` hides the `id` column from users. The value is still in each row, so edits can be matched to sheet rows. Hidden columns still take part in copy and paste, so the column is also `readOnly`: pasting rows or pressing <kbd>Delete</kbd> on a selected row can't change an ID. The sync sets new IDs with `setSourceDataAtCell`, which writes the data directly.

## Step 7: Run the app

Replace `src/main.ts`:

::: example #main-ts --code-only

@[code ts](@/content/recipes/real-time/google-sheets-sync/javascript/main.ts)

:::

Add the styles in `src/styles.css`:

::: example #styles-css --code-only

@[code css](@/content/recipes/real-time/google-sheets-sync/javascript/styles.css)

:::

Replace `index.html`. Google Identity Services must load from `accounts.google.com`. Google doesn't support self-hosting it.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Two-way sync with Google Sheets</title>
    <script src="https://accounts.google.com/gsi/client" async></script>
  </head>
  <body>
    <main>
      <h1>Two-way sync with Google Sheets</h1>
      <p class="toolbar">
        <button id="sign-in" type="button">Sign in with Google</button>
        <span id="status">Not connected</span>
        <span>Requests in the last minute: <strong id="requests">0</strong> / 60</span>
      </p>
      <div id="grid"></div>
    </main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:5173`, select **Sign in with Google**, and allow access. If the app reports a missing tab, rename the tab in Google Sheets or set `VITE_SHEET_NAME` to its name, then restart `npm run dev`: Vite reads `.env.local` only when it starts. The grid loads the sheet. Open the sheet in a second window and try the following:

1. Edit a cell in the grid. The sheet shows the new value within a second.
2. Edit a cell in the sheet. The grid shows it within about 5 seconds.
3. Sort the sheet by any column, then edit a cell in the grid. The right row changes.
4. Change a cell in the sheet, then change the same cell in the grid before the next poll. The grid shows a toast and the sheet's value.
5. Type `=1+1` in a grid cell. The sheet stores the text `=1+1`, not `2`.
6. Add and remove rows in both places.
7. Start editing a cell and wait for a poll. What you typed stays.

## How it works -- complete flow

1. The user signs in, and Google returns an access token to the page.
2. The grid reads the whole tab, takes the headers from row 1, and loads the rows that have an ID.
3. Every 5 seconds, the grid reads the tab again, matches rows by ID, and applies the changed values with one `setSourceDataAtCell` call, or replaces the data with `updateData` when rows were added or removed.
4. The user edits cells. After 300 ms without another edit, the grid reads the tab, drops each edit whose cell someone else changed, and writes the rest with one `values:batchUpdate` request.
5. The next poll sees the written values and clears them from the pending list.

## Production considerations

- **Publish the consent screen.** In **Testing** mode, only the test users you added can sign in. To let anyone sign in, publish the app. The `spreadsheets` scope is sensitive, so Google reviews the app before it shows the consent screen without a warning. An app for one Google Workspace organization can use the **Internal** user type, which needs no review.
- **Consider a narrower scope.** With `drive.file`, the app only gets the files a user created in it or picked with the [Google Picker](https://developers.google.com/workspace/drive/picker/guides/overview). Users grant access file by file, and because `drive.file` isn't a sensitive scope, it doesn't need Google's review.
- **Add every origin.** Google only accepts the client ID from the **Authorized JavaScript origins** you listed. Add your production origin, and each preview origin you use.
- **Close the gap between reading and writing.** Before each write, the grid reads the sheet to find each row's current position, then writes by row number. If someone sorts the sheet or inserts a row in the fraction of a second between the two requests, the write can land in the wrong row. To remove that window, tag each row with [developer metadata](https://developers.google.com/workspace/sheets/api/guides/metadata) that holds its ID, and write with `values:batchUpdateByDataFilter`, which finds rows by their metadata instead of their position.
- **Keep the sheet's shape stable.** The grid takes its columns from row 1 once. If someone renames, adds, or removes a column, the grid stops syncing, and the status line asks the user to reload the page. Protect row 1 and the `id` column in Google Sheets, so only the people who own the layout can change them.
- **Store dates as text, or convert them.** With `RAW`, a date typed in the grid is stored as text, and the sheet doesn't treat it as a date. To keep real dates, convert the value to a Sheets serial number before writing, or write that column with `USER_ENTERED`.
- **Know the limits.** The recipe reads the whole tab on every poll. That suits sheets with up to a few thousand rows. A Google Sheet holds at most 10 million cells. For larger data, keep it in a database and use the [`dataProvider` plugin](@/guides/getting-started/server-side-data/server-side-data.md).
- **Use a server for push updates.** To get changes in seconds instead of polling, run a small server that receives Drive `files.watch` notifications and forwards them to the browser, as the [Kafka recipe](@/recipes/real-time/kafka-stream/kafka-stream.md) does with Server-Sent Events.

## What you learned

- How to sign a user in with Google Identity Services and call the Sheets API from the browser, with no server.
- Why rows should be matched by an ID column, not by position.
- How to detect a conflicting edit by comparing the sheet's value with the value the grid had before the edit.
- Why `RAW` keeps typed text from becoming a formula.
- How to apply remote changes to Handsontable by physical row with `setSourceDataAtCell`, without interrupting an open editor.
- How to stay under the Sheets API quota with polling, batched writes, and exponential backoff.

## Next steps

- [Stream Kafka topics into the grid](@/recipes/real-time/kafka-stream/kafka-stream.md) -- push updates from a server with Server-Sent Events.
- [Saving data](@/guides/getting-started/saving-data/saving-data.md) -- the hooks and sources behind the write-back.
- [Notification](@/guides/dialog/notification/notification.md) -- the toasts the grid shows for conflicts and errors.
- [Google Sheets API usage limits](https://developers.google.com/workspace/sheets/api/limits) -- the quota and the recommended backoff.
- [Google Identity Services token model](https://developers.google.com/identity/oauth2/web/guides/use-token-model) -- how the browser gets an access token.

Google Sheets is a trademark of Google LLC.
