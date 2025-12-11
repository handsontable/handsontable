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
  ${icon(icons, "arrow_right")}
}

${prefix}.pika-single .pika-prev {
  ${icon(icons, "arrow_left")}
}

${prefix}.ht-page-size-section__select-wrapper::after {
  ${icon(icons, "arrow_down")}
}

${prefix}.changeType::before {
  ${icon(icons, "menu")}
}

${prefix}.htUISelectCaption::after,
.htAutocompleteArrow::after {
  ${icon(icons, "select_arrow")}
}

${prefix}.columnSorting.sortAction.ascending::before {
  ${icon(icons, "arrow_narrow_up")}
}

${prefix}.columnSorting.sortAction.descending::before {
  ${icon(icons, "arrow_narrow_down")}
}

${prefix}.ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrow_left_with_bar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-first::before {
  ${icon(icons, "arrow_right_with_bar")}
}

${prefix}.ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrow_left")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-prev::before {
  ${icon(icons, "arrow_right")}
}

${prefix}.ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrow_right")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-next::before {
  ${icon(icons, "arrow_left")}
}

${prefix}.ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrow_right_with_bar")}
}

${prefix}[dir="rtl"] .ht-page-navigation-section .ht-page-last::before {
  ${icon(icons, "arrow_left_with_bar")}
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
  ${icon(icons, "caret_hidden_left")}
}

${prefix}th.afterHiddenColumn::before {
  ${icon(icons, "caret_hidden_right")}
}

${prefix}th.beforeHiddenRow::after {
  ${icon(icons, "caret_hidden_up")}
}

${prefix}th.afterHiddenRow::before {
  ${icon(icons, "caret_hidden_down")}
}

${prefix}.collapsibleIndicator::before,
${prefix}.ht_nestingButton::before {
  ${icon(icons, "collapse_off")}
}

${prefix}.collapsibleIndicator.collapsed::before,
${prefix}.ht_nestingButton.ht_nestingExpand::before {
  ${icon(icons, "collapse_on")}
}

${prefix}.htUIRadio > input[type="radio"]::after {
  ${icon(icons, "radio")}
}`;
};
