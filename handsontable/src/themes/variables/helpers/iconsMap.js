const icon = (icons, name) => {
  return `width: var(--ht-icon-size);
  height: var(--ht-icon-size);
  -webkit-mask-size: contain;
  -webkit-mask-image: url("${icons[name]}");
  background-color: currentColor;`;
};

export const iconsMap = (icons, themePrefix) => {
  const prefix = themePrefix ? `[class*=${themePrefix}] ` : "";

  return `${prefix}.htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after,
${prefix}.pika-single .pika-next {
  ${icon(icons, "arrowRight")}
}

${prefix}.pika-single .pika-prev {
  ${icon(icons, "arrowLeft")}
}

${prefix}.ht-page-size-section__select-wrapper::after {
  ${icon(icons, "arrowDown")}
}

${prefix}.changeType::before {
  ${icon(icons, "menu")}
}

${prefix}.htUISelectCaption::after,
.htAutocompleteArrow::after {
  ${icon(icons, "selectArrow")}
}

${prefix}.columnSorting.sortAction.ascending::before {
  ${icon(icons, "arrowNarrowUp")}
}

${prefix}.columnSorting.sortAction.descending::before {
  ${icon(icons, "arrowNarrowDown")}
}

${prefix}.ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrowLeftWithBar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrowRightWithBar")}
}

${prefix}.ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrowLeft")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrowRight")}
}

${prefix}.ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrowRight")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrowLeft")}
}

${prefix}.ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrowRightWithBar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrowLeftWithBar")}
}

${prefix}.htDropdownMenu table tbody tr td .htItemWrapper span.selected::after,
${prefix}.htContextMenu table tbody tr td .htItemWrapper span.selected::after,
${prefix}.htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after {
  ${icon(icons, "check")}
}

${prefix}.htCheckboxRendererInput {
  appearance: none;
}

${prefix}.htCheckboxRendererInput::after {
  ${icon(icons, "checkbox")}
}

${prefix}th.beforeHiddenColumn::after {
  ${icon(icons, "caretHiddenLeft")}
}

${prefix}th.afterHiddenColumn::before {
  ${icon(icons, "caretHiddenRight")}
}

${prefix}th.beforeHiddenRow::after {
  ${icon(icons, "caretHiddenUp")}
}

${prefix}th.afterHiddenRow::before {
  ${icon(icons, "caretHiddenDown")}
}

${prefix}.collapsibleIndicator::before,
${prefix}.ht_nestingButton::before {
  ${icon(icons, "collapseOff")}
}

${prefix}.collapsibleIndicator.collapsed::before,
${prefix}.ht_nestingButton.ht_nestingExpand::before {
  ${icon(icons, "collapseOn")}
}

${prefix}.htUIRadio > input[type="radio"]::after {
  ${icon(icons, "radio")}
}`;
};
