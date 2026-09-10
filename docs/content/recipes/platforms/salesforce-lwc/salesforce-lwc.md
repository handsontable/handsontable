---
type: tutorial
title: Run Handsontable in a Salesforce Lightning Web Component
metaTitle: Salesforce LWC Tutorial - JavaScript Data Grid | Handsontable
description: Run Handsontable inside a Salesforce Lightning Web Component. Load the grid from a static resource, map Salesforce field metadata to columns, and write cell edits back through Lightning Data Service.
permalink: /recipes/platforms/salesforce-lwc
canonicalUrl: /recipes/platforms/salesforce-lwc
framework: javascript
tags:
  - salesforce
  - lightning web components
  - lwc
  - shadow dom
  - lightning web security
  - lightning data service
  - tutorial
  - recipes
searchCategory: Recipes
category: Platforms and embedding
menuTag: new
---

In this tutorial, you will run Handsontable inside a Salesforce Lightning Web Component, bound to live Account records. It covers only the glue between the grid and the platform: shipping the library as a static resource, getting its stylesheets across the shadow boundary, mapping Salesforce field metadata to column types, and turning grid hooks into Lightning Data Service calls. It assumes you already write Lightning Web Components.

## Overview

<a class="github-example-cta" href="https://github.com/handsontable/salesforce-lwc" target="_blank" rel="noopener noreferrer">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
  Get the full source on GitHub
</a>

![Handsontable running as a Lightning Web Component on a Salesforce Lightning app page, showing Account records with grouped columns](/img/pages/salesforce-lwc/grid-on-lightning-page.png)

**Difficulty:** Intermediate<br>
**Time:** ~30 minutes

Handsontable resolves mouse, focus, and clipboard events across the shadow boundary on its own, so clicking, the cell editors, copy and paste, and the context menu work under Lightning Web Security with no workaround code. What is left is the glue: the grid reaches the org as a static resource, its stylesheets have to land in the right document, its settings arrive as `@api` properties, and its hooks turn into Lightning Data Service calls.

This recipe runs against real org data, so the grid cannot run inside this page. The code below is complete, but it arrives in pieces: each step adds members to a class you already started. The [repository](https://github.com/handsontable/salesforce-lwc) holds both components as whole files if you would rather read them that way, or deploy them and follow along.

## What you'll build

A Lightning app page with an editable grid of Account records:

- Handsontable loaded from a static resource, with no bundler and no npm dependency in the org.
- Column types derived from Salesforce field metadata: picklists become dropdowns, numeric fields become numeric cells, and checkboxes become boolean cells. **All Accounts** carries no numeric or boolean field, so add `Employees` and `Annual Revenue` to the list view to watch those two mappings fire.
- Grouped, collapsible column headers built from field name prefixes such as `Billing` and `Shipping`.
- Cell edits, new rows, and deleted rows saved to Salesforce through Lightning Data Service, with no Apex.

Two components: `hotGrid` loads the static resource, creates the instance, and re-exposes settings as `@api` properties and hooks as DOM events; `handsontableApp` reads Account metadata and records, builds the column configuration, and writes changes back. The wrapper carries no Account-specific code, so it works for any object.

## Before you begin

You need the [Salesforce CLI](https://developer.salesforce.com/tools/salesforcecli) (`sf`) and an org you can deploy to - Developer Edition, a sandbox, or a Starter trial.

See the [Shadow DOM guide](@/guides/tools-and-building/shadow-dom/shadow-dom.md) for what the grid handles at the boundary.

You also need Account records in the **All Accounts** list view. Developer Edition orgs ship with sample accounts.

Authorize your org, and keep the alias - every command below targets it:

```shell
sf org login web --alias my-org --set-default
```

If you are starting from an empty directory, scaffold a project first:

```shell
sf project generate --name handsontable-lwc
cd handsontable-lwc
```

## Step 1: Add Handsontable as a static resource

Vendor three files from the package into a static resource and commit them:

```shell
npm install handsontable
mkdir -p force-app/main/default/staticresources/handsontable
cp node_modules/handsontable/dist/handsontable.full.min.js \
   node_modules/handsontable/styles/handsontable.min.css \
   node_modules/handsontable/styles/ht-theme-main.min.css \
   force-app/main/default/staticresources/handsontable/
```

That leaves the resource directory next to its metadata file:

```text
force-app/main/default/staticresources/
├── handsontable/
│   ├── handsontable.full.min.js
│   ├── handsontable.min.css
│   └── ht-theme-main.min.css
└── handsontable.resource-meta.xml
```

The npm dependency records which version you vendored; to upgrade, bump the package and repeat the copy. Without node in the project, download the same three files from a version-pinned CDN: [the script](https://cdn.jsdelivr.net/npm/handsontable@{{$currentVersion}}/dist/handsontable.full.min.js), [the base stylesheet](https://cdn.jsdelivr.net/npm/handsontable@{{$currentVersion}}/styles/handsontable.min.css), and [the theme stylesheet](https://cdn.jsdelivr.net/npm/handsontable@{{$currentVersion}}/styles/ht-theme-main.min.css). Keep the version in the URL - a static resource is a snapshot, so an unpinned URL changes what you uploaded.

One archive resource keeps the three files on one version, and `${HANDSONTABLE}/<file>` then addresses them. Three single-file resources work too, each with its own `contentType` and `resourceUrl` import.

Create `handsontable.resource-meta.xml` beside the directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/zip</contentType>
    <description>Handsontable - JavaScript data grid with spreadsheet UX. Includes JS, CSS, and theme files.</description>
</StaticResource>
```

`contentType` is `application/zip` because the CLI zips the directory on deploy; a Metadata API deploy needs the archive built yourself.

Load both stylesheets in the next step. `handsontable.min.css` carries the grid's structural styles, and `ht-theme-main.min.css` carries one [theme](@/guides/styling/themes/themes.md). Without the structural stylesheet, cell editors open in the wrong position.

## Step 2: Create the grid wrapper component

Generate the component:

```shell
sf lightning generate component --type lwc --name hotGrid --output-dir force-app/main/default/lwc
```

Handsontable writes its own DOM, so its container needs `lwc:dom="manual"`. The theme class goes on the same element:

```html
<!-- force-app/main/default/lwc/hotGrid/hotGrid.html -->
<template>
    <div class="grid-container ht-theme-main" lwc:dom="manual"></div>
</template>
```

Load the resource in `renderedCallback`, guarded by a flag. Order matters: both stylesheets, then the script, then the grid:

```js
// force-app/main/default/lwc/hotGrid/hotGrid.js
import { LightningElement, api } from 'lwc';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import HANDSONTABLE from '@salesforce/resourceUrl/handsontable';

export default class HotGrid extends LightningElement {
    _hot = null;
    _initialized = false;
    _data = [];
    _columns = [];
    _nestedHeaders = [];
    _collapsibleColumns = [];

    renderedCallback() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        loadStyle(this, `${HANDSONTABLE}/handsontable.min.css`)
            .then(() => loadStyle(this, `${HANDSONTABLE}/ht-theme-main.min.css`))
            .then(() => loadScript(this, `${HANDSONTABLE}/handsontable.full.min.js`))
            .then(() => {
                const container = this.template.querySelector('.grid-container');

                if (container) {
                    this._initializeGrid(container);
                }
            })
            .catch((error) => {
                console.error('HotGrid: failed to load', error?.message || error);
            });
    }

    disconnectedCallback() {
        if (this._hot) {
            this._hot.destroy();
            this._hot = null;
        }
    }

    _initializeGrid(container) {
        if (this._hot) {
            return;
        }

        const settings = {
            data: JSON.parse(JSON.stringify(this._data)),
            columns: this._columns.length ? this._columns : undefined,
            colHeaders: true,
            rowHeaders: true,
            height: 'auto',
            columnSorting: true,
            manualColumnResize: true,
            contextMenu: true,
            copyPaste: true,
            fillHandle: true,
            licenseKey: 'non-commercial-and-evaluation',
            afterChange: (changes, source) => {
                if (!changes || source === 'loadData') {
                    return;
                }

                changes.forEach(([row, col, oldValue, newValue]) => {
                    if (oldValue !== newValue) {
                        this.dispatchEvent(new CustomEvent('cellchange', {
                            detail: { row, col, oldValue, newValue },
                        }));
                    }
                });
            },
            afterCreateRow: (index, amount) => {
                this.dispatchEvent(new CustomEvent('rowcreate', { detail: { index, amount } }));
            },
            beforeRemoveRow: (index, amount) => {
                this.dispatchEvent(new CustomEvent('rowremoverequest', { detail: { index, amount } }));

                return false;
            },
        };

        if (this._nestedHeaders.length) {
            settings.nestedHeaders = this._nestedHeaders;
            settings.collapsibleColumns = this._collapsibleColumns.length
                ? this._collapsibleColumns : true;
        }

        this._hot = new window.Handsontable(container, settings);
    }
}
```

Two details:

- `loadScript` attaches the library to `window.Handsontable`, so the instance comes from the global, not from an import.
- `destroy()` in `disconnectedCallback` is not optional. Lightning Experience keeps navigated-away pages in memory, and an undestroyed grid keeps its listeners and its resize observer.

Replace `licenseKey` with your commercial key before production. See [License key](@/guides/getting-started/license-key/license-key.md).

Keep the wrapper unexposed:

```xml
<!-- force-app/main/default/lwc/hotGrid/hotGrid.js-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <isExposed>false</isExposed>
    <description>Core Handsontable wrapper component for LWC. Not intended for direct use on Lightning pages.</description>
</LightningComponentBundle>
```

## Step 3: Understand which shadow DOM mode you are in

Lightning Experience renders components with a synthetic shadow DOM polyfill by default, and this recipe sets no `shadowSupportMode`, so the grid runs in that mode. Step 2 is complete as written for it: `loadStyle` puts a `<link>` in `document.head`, and synthetic shadow DOM lets those styles reach the component.

To check which mode an org actually gives you, open the page with the grid on it, and run this in the browser console:

```js
const probe = document.createElement('style');

probe.textContent = '.ht_master td { color: rgb(255, 0, 0) !important; }';
document.head.appendChild(probe);
```

Red cell text means the styles are not encapsulated, so the component runs in synthetic shadow DOM. Unchanged text means a native shadow root.

Handsontable adds the `ht-shadow-dom` class to its root wrapper in both modes. The class carries `isolation: isolate`, which keeps the grid's overlays from competing with the Lightning Experience UI - but the declaration lives in `handsontable.min.css`, so the isolation only takes effect where that stylesheet reaches the grid. An unstyled grid has the class and none of the behavior.

### Use native shadow DOM

A native shadow root ignores `document.head`, so with `static shadowSupportMode = 'native'` the grid renders unstyled: no cell borders, transparent backgrounds, and the browser's default font. Load the stylesheets **twice** - once inside the shadow root for the grid, and once in the document head for the parts Handsontable renders outside it. Only the parts that change are shown here; the rest of the class stays as it is in Step 2:

```js
// force-app/main/default/lwc/hotGrid/hotGrid.js - changed parts only
export default class HotGrid extends LightningElement {
    static shadowSupportMode = 'native';

    renderedCallback() {
        if (this._initialized) {
            return;
        }
        this._initialized = true;

        const loadStylesheetInShadow = (href) => new Promise((resolve, reject) => {
            const link = document.createElement('link');

            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = () => reject(new Error(`Failed to load ${href}`));

            this.template.querySelector('.grid-container').appendChild(link);
        });

        Promise.all([
            loadStylesheetInShadow(`${HANDSONTABLE}/handsontable.min.css`),
            loadStylesheetInShadow(`${HANDSONTABLE}/ht-theme-main.min.css`),
            loadStyle(this, `${HANDSONTABLE}/handsontable.min.css`),
            loadStyle(this, `${HANDSONTABLE}/ht-theme-main.min.css`),
        ])
            .then(() => loadScript(this, `${HANDSONTABLE}/handsontable.full.min.js`))
            .then(() => {
                const container = this.template.querySelector('.grid-container');

                if (container) {
                    this._initializeGrid(container);
                }
            })
            .catch((error) => {
                console.error('HotGrid: failed to load', error?.message || error);
            });
    }
}
```

The shadow-root copies style the grid. The head copies style the context menu and the other dropdowns, which Handsontable renders into a portal in the document, outside the shadow root - drop them and the menu opens transparent, borderless, and without a shadow. The [Shadow DOM guide](@/guides/tools-and-building/shadow-dom/shadow-dom.md#load-the-styles-inside-the-shadow-root) shows the same split for a plain web component.

Lightning Experience caches component bundles per session, so after you redeploy the wrapper, check the styles in a private window. A hard refresh, and even a new tab, can still run the previous version.

## Step 4: Expose the grid's settings and hooks

Each setting is an `@api` accessor that also calls [`updateSettings()`](@/api/core.md#updatesettings) once the grid exists, so a wire that resolves after the first render still reaches it. Add these inside `HotGrid`:

```js
// force-app/main/default/lwc/hotGrid/hotGrid.js - inside the class
@api
get data() {
    return this._data;
}
set data(value) {
    this._data = value ? [...value] : [];

    if (this._hot) {
        this._hot.updateSettings({ data: JSON.parse(JSON.stringify(this._data)) });
    }
}

@api
get columns() {
    return this._columns;
}
set columns(value) {
    this._columns = value ? [...value] : [];

    if (this._hot) {
        this._hot.updateSettings({ columns: this._columns.length ? this._columns : undefined });
    }
}

@api
get nestedHeaders() {
    return this._nestedHeaders;
}
set nestedHeaders(value) {
    this._nestedHeaders = value ? [...value] : [];

    if (this._hot && this._nestedHeaders.length) {
        this._hot.updateSettings({ nestedHeaders: this._nestedHeaders });
    }
}

@api
get collapsibleColumns() {
    return this._collapsibleColumns;
}
set collapsibleColumns(value) {
    this._collapsibleColumns = value ? [...value] : [];

    if (this._hot && this._collapsibleColumns.length) {
        this._hot.updateSettings({ collapsibleColumns: this._collapsibleColumns });
    }
}

@api
getDataAtCell(row, col) {
    return this._hot ? this._hot.getDataAtCell(row, col) : null;
}
```

`_nestedHeaders` and `_collapsibleColumns` are already declared in Step 2, and `_initializeGrid()` already reads them - grouped headers replace `colHeaders` when the data component supplies them.

Every setting the data component binds needs an accessor here, and a missing one fails silently: with `nestedHeaders` never set, the grid falls back to `colHeaders: true` and labels the columns `A`, `B`, `C` instead of the field names.

The copies matter. Handsontable mutates the data source it is given, and a parent's reactive state arrives as a read-only proxy, so the deep copy and the array spreads are what keep the grid from writing into it. Skip them and the grid renders, every edit is rejected, the cell snaps back, and no `afterChange` fires.

The three hooks in that same settings object turn grid activity into DOM events. `afterChange` skips the `loadData` source, because without that guard the first data load reports every cell as an edit and the org receives a write for each one.

The two row hooks have opposite shapes on purpose. `afterCreateRow` reports a row the grid has already added, and that row stays local until the data component turns it into a record. `beforeRemoveRow` returns `false`, which [cancels the removal](@/api/hooks.md#beforeremoverow): the data component owns `data`, so it decides when the row disappears and can put it back when the org refuses the delete.

## Step 5: Build the columns from Salesforce field metadata

Generate the data component:

```shell
sf lightning generate component --type lwc --name handsontableApp --output-dir force-app/main/default/lwc
```

Its template wires the grid's properties and events:

```html
<!-- force-app/main/default/lwc/handsontableApp/handsontableApp.html -->
<template>
    <template if:true={error}>
        <div class="slds-text-color_error slds-p-around_small">{error}</div>
    </template>
    <c-hot-grid
        data={data}
        columns={columns}
        nested-headers={nestedHeaders}
        collapsible-columns={collapsibleColumns}
        oncellchange={handleCellChange}
        onrowcreate={handleRowCreate}
        onrowremoverequest={handleRowRemoveRequest}>
    </c-hot-grid>
</template>
```

Three wire adapters feed the grid: `getObjectInfo` for data types and labels, `getListUi` for the records, and `getPicklistValuesByRecordType` for dropdown sources. The third one is easy to miss - `getObjectInfo` reports that a field *is* a picklist but never lists its values, so a dropdown built from it offers nothing to choose. All three resolve independently, so each calls the same builder and the builder waits for all three:

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js
import { LightningElement, wire } from 'lwc';
import { getListUi } from 'lightning/uiListApi';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import { updateRecord, createRecord, deleteRecord } from 'lightning/uiRecordApi';
import ACCOUNT_OBJECT from '@salesforce/schema/Account';

const SKIP_FIELDS = ['Id', 'OwnerId', 'Owner', 'CreatedById', 'LastModifiedById',
    'LastModifiedDate', 'CreatedDate', 'SystemModstamp', 'IsDeleted',
    'LastViewedDate', 'LastReferencedDate', 'MasterRecordId',
    'PhotoUrl', 'CleanStatus', 'OperatingHoursId'];

const NUMERIC_SF_TYPES = ['Currency', 'Double', 'Int', 'Percent', 'Long'];
const GROUP_PREFIXES = ['Billing', 'Shipping'];

export default class HandsontableApp extends LightningElement {
    data = [];
    columns = [];
    nestedHeaders = [];
    collapsibleColumns = [];
    error = null;
    _recordIds = [];
    _fieldApiNames = [];
    _objectInfo = null;
    _listData = null;
    _picklists = null;
    _recordTypeId = undefined;

    @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
    wiredObjectInfo({ data, error }) {
        if (data) {
            this._objectInfo = data;
            this._recordTypeId = data.defaultRecordTypeId;
            this._buildGrid();
        } else if (error) {
            this.error = error.body?.message || 'Failed to load Account metadata';
        }
    }

    @wire(getPicklistValuesByRecordType, {
        objectApiName: ACCOUNT_OBJECT,
        recordTypeId: '$_recordTypeId',
    })
    wiredPicklists({ data, error }) {
        if (data) {
            this._picklists = data.picklistFieldValues;
            this._buildGrid();
        } else if (error) {
            this._picklists = {};
            this._buildGrid();
        }
    }

    @wire(getListUi, {
        objectApiName: ACCOUNT_OBJECT,
        listViewApiName: 'AllAccounts',
        pageSize: 50,
    })
    wiredAccounts({ data, error }) {
        if (data) {
            this._listData = data;
            this._buildGrid();
        } else if (error) {
            this.error = error.body?.message || 'Failed to load Accounts';
        }
    }
}
```

The builder maps each Salesforce data type to a Handsontable [cell type](@/guides/cell-types/cell-type/cell-type.md). Picklist entries become the `source` of a [dropdown](@/guides/cell-types/dropdown-cell-type/dropdown-cell-type.md), the numeric Salesforce types become [numeric](@/guides/cell-types/numeric-cell-type/numeric-cell-type.md) cells, and booleans become [checkboxes](@/guides/cell-types/checkbox-cell-type/checkbox-cell-type.md):

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
_columnFor(fieldApiName, fieldInfo) {
    if (!fieldInfo) {
        return { type: 'text' };
    }

    if (fieldInfo.dataType === 'Picklist') {
        const picklist = this._picklists ? this._picklists[fieldApiName] : null;
        const values = [''];

        (picklist ? picklist.values : []).forEach((entry) => {
            values.push(entry.value);
        });

        return { type: 'dropdown', source: values };
    }

    if (NUMERIC_SF_TYPES.includes(fieldInfo.dataType)) {
        return { type: 'numeric' };
    }

    if (fieldInfo.dataType === 'Boolean') {
        return { type: 'checkbox' };
    }

    return { type: 'text' };
}
```

Fill the `source` with each entry's `value`, not its `label`. The two differ on code-based picklists - a state field stores `NC` while its label reads `North Carolina` - and the record payload carries the value. Source the labels instead and the grid offers choices the API rejects: the cell shows `NC`, the dropdown lists `North Carolina`, and picking it fails the save with `An error occurred while trying to update the record`.

`SKIP_FIELDS` drops the fields that make no sense in a grid: system audit fields, and the ID and relationship fields whose values are not scalars. A relationship field such as `Owner` carries a nested record object rather than a string, so a cell would render `[object Object]`.

Read the field list off the first returned record rather than off the metadata. `getObjectInfo` describes every field on the object, while `getListUi` returns only the columns of the list view. A column built from metadata that the payload does not carry renders empty even when the record holds a value - and an edit to that empty cell still writes, so it silently overwrites the stored value with whatever the user typed. The grid then re-renders from the refreshed payload, the cell goes blank again, and the write looks like it failed when it did not.

Accounts carry two obvious field groups, `Billing*` and `Shipping*`, which map onto [nested headers](@/guides/columns/column-groups/column-groups.md) with [collapsible columns](@/api/options.md#collapsiblecolumns). The builder groups the fields by prefix, emits one header cell per group with a `colspan`, and flattens the records into the array of arrays the grid renders:

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
_groupOf(fieldName) {
    const prefix = GROUP_PREFIXES.find((candidate) => fieldName.startsWith(candidate));

    return prefix || 'General';
}

_buildGrid() {
    if (!this._objectInfo || !this._listData || !this._picklists) {
        return;
    }

    const records = this._listData.records.records;

    if (!records || records.length === 0) {
        this.error = 'No accounts found';

        return;
    }

    const fieldInfoMap = this._objectInfo.fields;
    const availableFields = Object.keys(records[0].fields)
        .filter((field) => !SKIP_FIELDS.includes(field));

    const groups = {};
    const groupOrder = [];

    availableFields.forEach((field) => {
        const group = this._groupOf(field);

        if (!groups[group]) {
            groups[group] = [];
            groupOrder.push(group);
        }

        groups[group].push(field);
    });

    groupOrder.sort((a, b) => {
        if (a === 'General') {
            return -1;
        }

        if (b === 'General') {
            return 1;
        }

        return a.localeCompare(b);
    });

    const orderedFields = [];

    groupOrder.forEach((group) => orderedFields.push(...groups[group]));

    const groupRow = [];
    const fieldRow = [];
    const collapsible = [];
    let colIndex = 0;

    groupOrder.forEach((group) => {
        const fields = groups[group];

        groupRow.push({ label: group, colspan: fields.length });
        collapsible.push({ row: -2, col: colIndex, collapsible: true });

        fields.forEach((field) => {
            const info = fieldInfoMap[field];

            fieldRow.push(info ? info.label : field);
        });

        colIndex += fields.length;
    });

    this.nestedHeaders = [groupRow, fieldRow];
    this.collapsibleColumns = collapsible;
    this.columns = orderedFields.map((field) => this._columnFor(field, fieldInfoMap[field]));

    this._fieldApiNames = orderedFields;
    this._recordIds = records.map((record) => record.id);
    this.data = records.map((record) => orderedFields.map((field) => {
        const value = record.fields[field]?.value;

        return value != null ? value : '';
    }));
    this.error = null;
}
```

The `row: -2` in each collapsible entry addresses the upper of the two header rows. Header rows count upward from the data, so the group row of a two-row header is `-2` and the field row is `-1`.

The `_recordIds` and `_fieldApiNames` arrays are what turn a cell coordinate back into a Salesforce field on a Salesforce record, which is how Step 6 saves an edit.

The list view decides which columns exist, so the mapping only shows what it carries. Stock **All Accounts** returns `Name`, `Site`, `Phone`, `Type`, and `BillingStateCode` - one dropdown and four text columns. Add `Employees`, `Annual Revenue`, or a checkbox field through **List View Controls** > **Select Fields to Display**, or point `listViewApiName` at your own list view, and those columns arrive as `numeric` and `checkbox` cells with no code change.

![Account records rendered in the grid with grouped Billing and Shipping headers and a picklist dropdown open in a cell](/img/pages/salesforce-lwc/column-types-and-groups.png)

## Step 6: Save changes back to Salesforce

Each grid event maps to one Lightning Data Service call. A cell edit resolves to a record ID and a field API name, and `updateRecord` writes it.

First, a helper for the error path. A rejected call puts `An error occurred while trying to update the record. Please try again.` in `error.body.message`, and the real reason in `error.body.output.errors`. Read the specific one when it is there:

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
_messageFrom(error, fallback) {
    const recordErrors = error?.body?.output?.errors;

    if (recordErrors && recordErrors.length) {
        return recordErrors.map((entry) => entry.message).join(' ');
    }

    return error?.body?.message || fallback;
}
```

Without it, a refused delete says "please try again" and the user retries forever. With it, the grid shows the org's own explanation - which cases block the delete, and which opportunities.

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
handleCellChange(event) {
    const { row, col, newValue } = event.detail;
    const recordId = this._recordIds[row];
    const fieldName = this._fieldApiNames[col];

    if (!recordId || !fieldName) {
        return;
    }

    updateRecord({ fields: { Id: recordId, [fieldName]: newValue } })
        .catch((error) => {
            this.error = this._messageFrom(error, 'Save failed');
        });
}
```

A new row is trickier. Handsontable fires `afterCreateRow` while the row is still empty, and a paste fills its cells afterwards, so creating the record immediately would save a blank one. Insert a `null` placeholder in `_recordIds` to keep the row-to-record mapping aligned, then read the row back on the next tick and create the record from whatever landed in it:

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
handleRowCreate(event) {
    const { index, amount } = event.detail;
    const grid = this.template.querySelector('c-hot-grid');

    for (let i = 0; i < amount; i++) {
        const rowIndex = index + i;

        this._recordIds.splice(rowIndex, 0, null);

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const fields = {};

            this._fieldApiNames.forEach((field, col) => {
                const value = grid?.getDataAtCell?.(rowIndex, col);

                if (value != null && value !== '') {
                    fields[field] = value;
                }
            });

            if (!fields.Name) {
                fields.Name = 'New Account';
            }

            createRecord({ apiName: 'Account', fields })
                .then((record) => {
                    this._recordIds[rowIndex] = record.id;
                })
                .catch((error) => {
                    this.error = this._messageFrom(error, 'Create failed');
                });
        }, 100);
    }
}
```

The `null` placeholder also protects `handleCellChange`: a cell edit on a row whose record does not exist yet finds no ID and returns instead of writing to the wrong record.

`createRecord` does not refresh the list view, so the new row keeps whatever the user typed into it and shows no server-side values - the record exists, but `getListUi` still returns the page it fetched before the insert. Reload the page, or call [`refreshApex`](https://developer.salesforce.com/docs/platform/lwc/guide/apex-result-caching.html) on the wired list result, when the row has to come back from the server.

Deletes are the one call the org refuses often, so the row removal is optimistic and reversible. Take the row out of `data` right away, fire the deletes, and put the row back at the same index if any of them rejects:

```js
// force-app/main/default/lwc/handsontableApp/handsontableApp.js - inside the class
handleRowRemoveRequest(event) {
    const { index, amount } = event.detail;
    const removedIds = this._recordIds.slice(index, index + amount);
    const removedRows = this.data.slice(index, index + amount);

    this._recordIds.splice(index, amount);
    this.data = [...this.data.slice(0, index), ...this.data.slice(index + amount)];
    this.error = null;

    Promise.all(removedIds.map((recordId) => (recordId ? deleteRecord(recordId) : Promise.resolve())))
        .catch((error) => {
            this._recordIds.splice(index, 0, ...removedIds);
            this.data = [
                ...this.data.slice(0, index),
                ...removedRows,
                ...this.data.slice(index),
            ];
            this.error = this._messageFrom(error, 'Delete failed');
        });
}
```

Capture `removedIds` and `removedRows` before you splice, because they are what the rollback puts back. Each assignment to `this.data` is a new array, which is what pushes the change through the `@api` setter and into `updateSettings()`.

Without the rollback the grid quietly disagrees with the org: the row is gone locally, the record is not, and nothing says so until a reload. Refused deletes are common, not exotic - Salesforce blocks deleting an account that has related cases or closed-won opportunities.

Expose this component so it can be dropped onto a Lightning page:

```xml
<!-- force-app/main/default/lwc/handsontableApp/handsontableApp.js-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <isExposed>true</isExposed>
    <masterLabel>Handsontable</masterLabel>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__HomePage</target>
        <target>lightning__RecordPage</target>
    </targets>
</LightningComponentBundle>
```

## Step 7: Deploy and open the grid

Drop the component onto an app page in **Lightning App Builder**, or deploy the page as metadata:

```xml
<!-- force-app/main/default/flexipages/Handsontable_Grid.flexipage-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<FlexiPage xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPageRegions>
        <itemInstances>
            <componentInstance>
                <componentName>handsontableApp</componentName>
                <identifier>c_handsontableApp</identifier>
            </componentInstance>
        </itemInstances>
        <name>main</name>
        <type>Region</type>
    </flexiPageRegions>
    <masterLabel>Handsontable Grid</masterLabel>
    <template>
        <name>flexipage:defaultAppHomeTemplate</name>
    </template>
    <type>AppPage</type>
</FlexiPage>
```

Leave the region's `mode` out - `<mode>Replace</mode>` under `flexipage:defaultAppHomeTemplate` fails the deploy.

```xml
<!-- force-app/main/default/tabs/Handsontable_Grid.tab-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<CustomTab xmlns="http://soap.sforce.com/2006/04/metadata">
    <flexiPage>Handsontable_Grid</flexiPage>
    <label>Handsontable Grid</label>
    <motif>Custom53: Bell</motif>
</CustomTab>
```

```xml
<!-- force-app/main/default/permissionsets/Handsontable_Grid.permissionset-meta.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Handsontable Grid</label>
    <hasActivationRequired>false</hasActivationRequired>
    <tabSettings>
        <tab>Handsontable_Grid</tab>
        <visibility>Visible</visibility>
    </tabSettings>
</PermissionSet>
```

Deploy, assign the permission set, and open the page:

```shell
sf project deploy start --source-dir force-app/main/default --target-org my-org
sf org assign permset --name Handsontable_Grid --target-org my-org
sf org open --target-org my-org --path "/lightning/n/Handsontable_Grid"
```

Edit a cell and reload the page. The value persists, because it went to the org and came back from it.

## Known limitations

- Tabbing in from another component focuses the grid without selecting a cell, so the arrow keys do nothing until the user clicks. Select one yourself on `focusin` - the [web component recipe](@/recipes/platforms/web-components/web-components.md) shows that listener.
- The grid holds one list view page - 50 records here. For more, page through the list view or drive the grid with the [`dataProvider` plugin](@/guides/getting-started/server-side-data/server-side-data.md) against Apex.
- One call per cell edit and per removed row, so a wide paste is one `updateRecord` per cell. Batch through Apex for bulk editing.
- ID and relationship fields do not render as text. `OwnerId` gives the ID, and `Owner` gives a nested record object that renders `[object Object]` - hence `SKIP_FIELDS`.
- Deletes fail on accounts with related cases or closed-won opportunities, as `DELETE_FAILED` listing what blocks them. The row returns and the message explains why.
- Dependent picklists offer every value. Each entry carries a `validFor` mask naming its controlling values, which `_columnFor` ignores, so a state field lists the states of every country. Filter `values` per row against the controlling field.
- Field-level security is enforced by the API, not the grid: a read-only field still accepts input and fails on save. Mark those columns [`readOnly`](@/api/options.md#readonly).

## What you learned

- The grid ships as a static resource and is created from `window.Handsontable` after its stylesheets resolve.
- Field metadata generates the column configuration, and the list view payload decides which fields exist.
- Settings cross as `@api` properties, forwarded through `updateSettings()` and deep-copied out of the reactive proxy.
- Hooks become DOM events, each mapping to one Lightning Data Service call, with `beforeRemoveRow` making deletes reversible.

## Next steps

- [Shadow DOM](@/guides/tools-and-building/shadow-dom/shadow-dom.md) - what Handsontable resolves at the shadow boundary, and how to load styles inside a shadow root.
- [Server-side data](@/guides/getting-started/server-side-data/server-side-data.md) - move pagination, sorting, and filtering to the server for larger objects.
- [Cell types](@/guides/cell-types/cell-type/cell-type.md) - extend the field-type mapping with dates, times, and custom editors.
