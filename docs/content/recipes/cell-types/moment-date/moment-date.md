---
id: 9f21530e
title: Moment.js-based date
metaTitle: Moment.js Cell Type - JavaScript Data Grid | Handsontable
description: Learn how to create a Handsontable custom date cell type using the Moment.js library
permalink: /recipes/cell-types/moment-date
canonicalUrl: /recipes/cell-types/moment-date
tags:
  - guides
  - tutorial
  - recipes
  - moment.js
  - date
react:
  id: 7d23a45b
  metaTitle: Moment.js date Cell Type - React Data Grid | Handsontable
angular:
  id: 3d23a45b
  metaTitle: Moment.js date Cell Type - Angular Data Grid | Handsontable
searchCategory: Recipes
category: Cell Types
---

# Moment.js date Cell Type - Step-by-Step Guide

[[toc]]

## Overview

This guide shows how to create a custom date cell type using the [Moment.js](https://momentjs.com/) library. Users can format dates using the Moment.js API.

**Difficulty:** Beginner
**Time:** ~25 minutes
**Libraries:** `moment`, `@handsontable/pikaday`

## Complete Example

::: example #example1 :hot-recipe --js 1 --ts 2

@[code](@/content/recipes/cell-types/moment-date/javascript/example1.js)
@[code](@/content/recipes/cell-types/moment-date/javascript/example1.ts)

:::

## What You'll Build

A cell that:
- Displays the date value as text with a formatted value
- Cell that accepts `dateFormat` options for cell formatting customization
- Validates date format
- Corrects date format if needed

## Prerequisites

```bash
npm install moment @handsontable/pikaday
```

## Step 1: Import Dependencies

```typescript
import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { getRenderer } from 'handsontable/renderers';
import { editorFactory } from 'handsontable/editors';
import { registerCellType } from 'handsontable/cellTypes';
import moment from 'moment';
import Pikaday from '@handsontable/pikaday';

registerAllModules();
```

**Why this matters:**
- Import moment library for date formatting functionality
- Import Pikaday library for date picker functionality

## Step 2: Create the Renderer

The renderer controls how the cell looks when not being edited. We use the `getRenderer` helper to get already built-in called `autocomplete` renderer. It renders a nice arrow icon that indicates that the cell has a date picker.

```typescript
renderer: getRenderer('autocomplete')
```

## Step 3: Create the Validator

The validator controls how the cell is validated when the user is editing a cell. We use the `moment` library to validate the date format and the date itself. We also allow the user to correct the date format if needed.

```typescript
validator: function(value, callback) {
  let valid = true;

  if (value === null || value === undefined) {
    value = '';
  }

  let isValidFormat = moment(value, this.dateFormat, true).isValid();
  let isValidDate = moment(new Date(value)).isValid() || isValidFormat;

  if (this.allowEmpty && value === '') {
    isValidDate = true;
    isValidFormat = true;
  }
  if (!isValidDate) {
    valid = false;
  }
  if (!isValidDate && isValidFormat) {
    valid = true;
  }

  if (isValidDate && !isValidFormat) {
    if (this.correctFormat === true) {
      const correctedValue = correctFormat(value, this.dateFormat);

      this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'dateValidator');
      valid = true;
    } else {
      valid = false;
    }
  }

  callback(valid);
}
```

**What's happening:**
- We check if the value is null or undefined and set it to an empty string if it is
- We validate the date format using the `moment` library
- We validate the date itself using the `moment` library
- We allow the user to correct the date format if needed
- We call the callback with the validation result

## Step 4: Create the Editor

The editor controls how the cell is edited when the user is editing a cell. We use the `pikaday` library to create a date picker.

```typescript
editor: editorFactory({
  position: 'portal',
  shortcuts: [
    {
      keys: [['ArrowLeft']],
      callback: (editor, _event) => {
        // @ts-ignore
        editor.pikaday.adjustDate('subtract', 1);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowRight']],
      callback: (editor, _event) => {
        // @ts-ignore
        editor.pikaday.adjustDate('add', 1);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowUp']],
      callback: (editor, _event) => {
        // @ts-ignore
        editor.pikaday.adjustDate('subtract', 7);
        _event.preventDefault();
      },
    },
    {
      keys: [['ArrowDown']],
      callback: (editor, _event) => {
        // @ts-ignore
        editor.pikaday.adjustDate('add', 7);
        _event.preventDefault();
      },
    },
  ],
  init(editor) {
    editor.parentDestroyed = false;
    // create the input element on init. This is a text input that color picker will be attached to.
    editor.input = editor.hot.rootDocument.createElement('input');
    editor.datePicker = editor.container;
    // Prevent recognizing clicking on datepicker as clicking outside of table.
    editor.hot.rootDocument.addEventListener('mousedown', (event) => {
      if (event.target && event.target.classList.contains('pika-day')) {
        editor.hideDatepicker(editor);
      }
    });
  },
  getDatePickerConfig(editor) {
    const htInput = editor.input;
    const options = {};

    if (editor.cellProperties && editor.cellProperties.datePickerConfig) {
      Object.assign(options, editor.cellProperties.datePickerConfig);
    }

    const origOnSelect = options.onSelect;
    const origOnClose = options.onClose;

    options.field = htInput;
    options.trigger = htInput;
    options.container = editor.datePicker;
    options.bound = false;
    options.keyboardInput = false;
    options.format = options.format ?? editor.getDateFormat(editor);
    options.reposition = options.reposition || false;
    // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
    // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
    options.isRTL = false;
    options.onSelect = function (date) {
      let dateStr;

      if (!isNaN(date.getTime())) {
        dateStr = moment(date).format(editor.getDateFormat(editor));
      }

      editor.setValue(dateStr);

      if (origOnSelect) {
        origOnSelect.call(editor.pikaday, date);
      }

      if (Handsontable.helper.isMobileBrowser()) {
        editor.hideDatepicker(editor);
      }
    };
    options.onClose = () => {
      if (!editor.parentDestroyed) {
        editor.finishEditing(false);
      }

      if (origOnClose) {
        origOnClose();
      }
    };

    return options;
  },
  hideDatepicker(editor) {
    editor.pikaday.hide();
  },
  showDatepicker(editor, event) {
    const dateFormat = editor.getDateFormat(editor);
    // TODO: view is not exported in the handsontable library d.ts, so we need to use @ts-ignore
    // @ts-ignore
    const isMouseDown = editor.hot.view.isMouseDown();
    const isMeta = event && 'keyCode' in event ? Handsontable.helper.isFunctionKey(event.keyCode) : false;

    let dateStr;

    editor.datePicker.style.display = 'block';
    editor.pikaday = new Pikaday(editor.getDatePickerConfig(editor));

    // TODO: useMoment is not exported in the pikaday library d.ts, so we need to use @ts-ignore
    // @ts-ignore
    if (typeof editor.pikaday.useMoment === 'function') {
      // @ts-ignore
      editor.pikaday.useMoment(moment);
    }

    // TODO: _onInputFocus is not exported in the pikaday library d.ts, so we need to use @ts-ignore
    // @ts-ignore
    editor.pikaday._onInputFocus = function () {};

    if (editor.originalValue) {
      dateStr = editor.originalValue;

      if (moment(dateStr, dateFormat, true).isValid()) {
        editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
      }

      // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
      if (editor.getValue() !== editor.originalValue) {
        editor.setValue(editor.originalValue);
      }

      if (!isMeta && !isMouseDown) {
        editor.setValue('');
      }
    } else if (editor.cellProperties.defaultDate) {
      dateStr = editor.cellProperties.defaultDate;

      if (moment(dateStr, dateFormat, true).isValid()) {
        editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
      }

      if (!isMeta && !isMouseDown) {
        editor.setValue('');
      }
    } else {
      // if a default date is not defined, set a soft-default-date: display the current day and month in the
      // datepicker, but don't fill the editor input
      editor.pikaday.gotoToday();
    }
  },
  afterClose(editor) {
    if (editor.pikaday.destroy) {
      editor.pikaday.destroy();
    }
  },
  afterOpen(editor, event) {
    editor.showDatepicker(editor, event);
  },
  getValue(editor) {
    return editor.input.value;
  },
  setValue(editor, value) {
    editor.input.value = value;
  },
  getDateFormat(editor) {
    return editor.cellProperties.dateFormat ?? 'DD/MM/YYYY';
  },
}),
```

**What's happening:**
- We create a new Pikaday instance
- We set the date format to the format specified in the `cellProperties.dateFormat` property

## Step 5: Complete Cell Type Definition

Put all the pieces together:

```typescript
const correctFormat = (value, dateFormat) => {
  const dateFromDate = moment(value);
  const dateFromMoment = moment(value, dateFormat);
  const isAlphanumeric = value.search(/[A-Za-z]/g) > -1;
  let date;

  if ((dateFromDate.isValid() && dateFromDate.format('x') === dateFromMoment.format('x')) ||
      !dateFromMoment.isValid() ||
      isAlphanumeric) {
    date = dateFromDate;

  } else {
    date = dateFromMoment;
  }

  return date.format(dateFormat);
}

const copyStyleFromElements = (source, target, keys = [], keysStartsWith = []) => {
  const computedStyle = getComputedStyle(source);

  Array.from(computedStyle)
    .filter((key) => {
      if (keys.length === 0 && keysStartsWith.length === 0) {
        return true;
      }

      if (keys.length > 0) {
        if (keys.includes(key)) {
          return true;
        }
      }

      if (keysStartsWith.length > 0) {
        if (keysStartsWith.some((startsWith) => key.startsWith(startsWith))) {
          return true;
        }
      }

      return false;
    })
    .forEach((key) =>
      target.style.setProperty(key, computedStyle.getPropertyValue(key), computedStyle.getPropertyPriority(key))
    );
};

const cellDateTypeDefinition = {
  renderer: getRenderer('autocomplete'),
  validator: function(value, callback) {
    let valid = true;

    if (value === null || value === undefined) {
      value = '';
    }

    let isValidFormat = moment(value, this.dateFormat, true).isValid();
    let isValidDate = moment(new Date(value)).isValid() || isValidFormat;

    if (this.allowEmpty && value === '') {
      isValidDate = true;
      isValidFormat = true;
    }
    if (!isValidDate) {
      valid = false;
    }
    if (!isValidDate && isValidFormat) {
      valid = true;
    }

    if (isValidDate && !isValidFormat) {
      if (this.correctFormat === true) {
        const correctedValue = correctFormat(value, this.dateFormat);

        this.instance.setDataAtCell(this.visualRow, this.visualCol, correctedValue, 'dateValidator');
        valid = true;
      } else {
        valid = false;
      }
    }

    callback(valid);
  },
  editor: editorFactory({
    position: 'portal',
    shortcuts: [
      {
        keys: [['ArrowLeft']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('subtract', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowRight']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('add', 1);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowUp']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('subtract', 7);
          _event.preventDefault();
        },
      },
      {
        keys: [['ArrowDown']],
        callback: (editor, _event) => {
          // @ts-ignore
          editor.pikaday.adjustDate('add', 7);
          _event.preventDefault();
        },
      },
    ],
    init(editor) {
      editor.parentDestroyed = false;
      // create the input element on init. This is a text input that color picker will be attached to.
      editor.input = editor.hot.rootDocument.createElement('input');
      editor.datePicker = editor.container;
      // Prevent recognizing clicking on datepicker as clicking outside of table.
      editor.hot.rootDocument.addEventListener('mousedown', (event) => {
        if (event.target && event.target.classList.contains('pika-day')) {
          editor.hideDatepicker(editor);
        }
      });
    },
    getDatePickerConfig(editor) {
      const htInput = editor.input;
      const options = {};

      if (editor.cellProperties && editor.cellProperties.datePickerConfig) {
        Object.assign(options, editor.cellProperties.datePickerConfig);
      }

      const origOnSelect = options.onSelect;
      const origOnClose = options.onClose;

      options.field = htInput;
      options.trigger = htInput;
      options.container = editor.datePicker;
      options.bound = false;
      options.keyboardInput = false;
      options.format = options.format ?? editor.getDateFormat(editor);
      options.reposition = options.reposition || false;
      // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
      // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
      options.isRTL = false;
      options.onSelect = function (date) {
        let dateStr;

        if (!isNaN(date.getTime())) {
          dateStr = moment(date).format(editor.getDateFormat(editor));
        }

        editor.setValue(dateStr);

        if (origOnSelect) {
          origOnSelect.call(editor.pikaday, date);
        }

        if (Handsontable.helper.isMobileBrowser()) {
          editor.hideDatepicker(editor);
        }
      };
      options.onClose = () => {
        if (!editor.parentDestroyed) {
          editor.finishEditing(false);
        }

        if (origOnClose) {
          origOnClose();
        }
      };

      return options;
    },
    hideDatepicker(editor) {
      editor.pikaday.hide();
    },
    showDatepicker(editor, event) {
      const dateFormat = editor.getDateFormat(editor);
      // TODO: view is not exported in the handsontable library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      const isMouseDown = editor.hot.view.isMouseDown();
      const isMeta = event && 'keyCode' in event ? Handsontable.helper.isFunctionKey(event.keyCode) : false;

      let dateStr;

      editor.datePicker.style.display = 'block';
      editor.pikaday = new Pikaday(editor.getDatePickerConfig(editor));

      // TODO: useMoment is not exported in the pikaday library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      if (typeof editor.pikaday.useMoment === 'function') {
        // @ts-ignore
        editor.pikaday.useMoment(moment);
      }

      // TODO: _onInputFocus is not exported in the pikaday library d.ts, so we need to use @ts-ignore
      // @ts-ignore
      editor.pikaday._onInputFocus = function () {};

      if (editor.originalValue) {
        dateStr = editor.originalValue;

        if (moment(dateStr, dateFormat, true).isValid()) {
          editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
        }

        // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
        if (editor.getValue() !== editor.originalValue) {
          editor.setValue(editor.originalValue);
        }

        if (!isMeta && !isMouseDown) {
          editor.setValue('');
        }
      } else if (editor.cellProperties.defaultDate) {
        dateStr = editor.cellProperties.defaultDate;

        if (moment(dateStr, dateFormat, true).isValid()) {
          editor.pikaday.setMoment(moment(dateStr, dateFormat), true);
        }

        if (!isMeta && !isMouseDown) {
          editor.setValue('');
        }
      } else {
        // if a default date is not defined, set a soft-default-date: display the current day and month in the
        // datepicker, but don't fill the editor input
        editor.pikaday.gotoToday();
      }
    },
    afterClose(editor) {
      if (editor.pikaday.destroy) {
        editor.pikaday.destroy();
      }
    },
    afterOpen(editor, event) {
      copyStyleFromElements(
        editor.TD,
        editor.input,
        [
          'width',
          'height',
          'background',
          'font-family',
          'font-size',
          'font-weight',
          'line-height',
          'color',
          'box-sizing',
        ],
        ['border-', 'padding-', 'margin-']
      );
      editor.showDatepicker(editor, event);
    },
    getValue(editor) {
      return editor.input.value;
    },
    setValue(editor, value) {
      editor.input.value = value;
    },
    getDateFormat(editor) {
      return editor.cellProperties.dateFormat ?? 'DD/MM/YYYY';
    },
  }),
};

registerCellType('moment-date', cellDateTypeDefinition);
```

**What's happening:**
- **renderer**: Uses the build-in `autocomplete` renderer to display the date arrow icon
- **validator**: Creates a custom validator that validates the date format and the date itself using the `moment` library
- **editor**: Creates a custom editor that uses the `pikaday` library to create a date picker
- **registerCellType**: Registers a new cell type called `moment-date` ready to be used in the Handsontable grid

## Step 6: Use in Handsontable

```typescript
const container = document.querySelector('#example1')!;
const hotOptions: Handsontable.GridSettings = {
  data: [
    { id: 1, itemName: 'Lunar Core', cost: '2026-02-11' },
    { id: 2, itemName: 'Zero Thrusters', cost: '2026-02-11' },
    { id: 3, itemName: 'EVA Suits', cost: '2026-02-11' },
  ],
  colHeaders: [
    'ID',
    'Item Name',
    'Date',
  ],
  autoRowSize: true,
  rowHeaders: true,
  height: 'auto',
  columns: [
    { data: 'id', type: 'numeric' },
    { data: 'itemName', type: 'text' },
    {
      data: 'cost',
      type: 'moment-date', // a new cell type
      dateFormat: 'YYYY-MM-DD',
      correctFormat: true,
      datePickerConfig: {
        firstDay: 0,
        showWeekNumber: true,
        disableDayFn(date) {
          return date.getDay() === 0 || date.getDay() === 6;
        },
      },
    }
  ],
  licenseKey: 'non-commercial-and-evaluation',
};

const hot = new Handsontable(container, hotOptions);
```

**Key configuration:**
- `type` - sets the cell type to `moment-date`
- `dateFormat` - the date format to use for the cell. Defaults to `YYYY-MM-DD`
- `correctFormat` - whether to correct the date format if it is not valid.
- `datePickerConfig` - any options passed to the `datePickerConfig` property will be passed to the `pikaday` library for configuring the date picker

## How It Works - Complete Flow

1. **Initial Render**: Cell displays example value with formatted value using the `moment` library
2. **User enters date**: Date is validated and saved to cell
3. **Validation**: Validator checks if the date format and the date itself are valid
4. **Save**: If valid, value is saved to cell; if invalid, editor may stay open
