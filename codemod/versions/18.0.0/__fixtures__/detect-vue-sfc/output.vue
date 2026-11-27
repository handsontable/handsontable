<template>
  <div class="pika-single">
    <hot-table :settings="settings" />
  </div>
</template>

<script>
import Handsontable from 'handsontable';

export default {
  data() {
    return {
      settings: {
        // TODO(handsontable-codemod 18.0.0/numbro-pattern): Replace numericFormat.pattern with Intl.NumberFormat options. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#migrate-numeric-format-from-numbrojs-pattern-and-culture-to-intlnumberformat
        columns: [{ type: 'numeric', numericFormat: { pattern: '0.00' } }],
      },
    };
  },
};
</script>

<style>
/* TODO(handsontable-codemod 18.0.0/wrapper-dom-selectors): Select by class instead, for example .ht-grid-content > .handsontable or .ht-wrapper.handsontable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-css-selectors-and-dom-queries-for-the-new-wrapper-structure */
.ht-grid > .handsontable {
  border: 0;
}
</style>
