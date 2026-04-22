# DataProvider Plugin - Test Verification Summary

## Summary of Discrepancies

| # | Test Plan Claim | Actual Behavior |
|---|---|---|
| 8.7 | "console warns" for missing `rowId` | **[Bug in Test Plan]** Code calls `logError` → `console.error`, not `console.warn`. Test assertion targets the wrong console method. |
| 11.2 | "console warning" when `rowId` is absent | **[Bug in Test Plan]** No warning fires when `rowId` is absent. Warning only fires when `rowId` is explicitly set to an invalid type. Confirmed by spec `dataProvider.spec.js:23-36`. |
| 11.5 | Warning text: `"rowId is neither a string nor a function"` | **[Bug in Test Plan]** Actual text: `"DataProvider Plugin: 'rowId' option is not valid and it will be ignored."` (from `base.js:350`). |
| 13.1 | `skipLoading` is a boolean (not `undefined`) on internal refetches | **[Bug in Implementation]** `skipLoading` is only set on sort and post-CRUD refetches. Page navigation (`fetchData({ page })`) and filter refetches (`fetchData()`) leave `skipLoading` absent (`undefined`) in the hook payload. |
| 15.5 | Refetch triggered after `updateSettings({ data: [...] })` | **[Bug in Implementation]** No refetch occurs. `DataProvider`'s `updatePlugin` is not called when `dataProvider` is absent from the settings payload. In-memory data resets to `[]` but the grid stays empty. |
