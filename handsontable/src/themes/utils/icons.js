const icon = (icons, name) => {
  return `
    width: var(--ht-icon-size);
    height: var(--ht-icon-size);
    -webkit-mask-size: contain;
    -webkit-mask-image: url("${icons[name]}");
    background-color: currentColor;
  `;
};

export const iconsMap = (icons) => {
  return `
    .htDropdownMenu table tbody tr td.htSubmenu .htItemWrapper::after,
    .htContextMenu table tbody tr td.htSubmenu .htItemWrapper::after,
    .htFiltersConditionsMenu table tbody tr td.htSubmenu .htItemWrapper::after,
    .pika-single .pika-next {
      ${icon(icons, 'arrowRight')}
    }

    .pika-single .pika-prev {
      ${icon(icons, 'arrowLeft')}
    }

    .ht-page-size-section__select-wrapper::after {
      ${icon(icons, 'arrowDown')}
    }

    .changeType::before {
      ${icon(icons, 'menu')}
    }

    .htUISelectCaption::after,
    .htAutocompleteArrow::after {
      ${icon(icons, 'selectArrow')}
    }

    .columnSorting.sortAction.ascending::before {
      ${icon(icons, 'arrowNarrowUp')}
    }

    .columnSorting.sortAction.descending::before {
      ${icon(icons, 'arrowNarrowDown')}
    }

    .ht-page-navigation-section .ht-page-first::before {
      ${icon(icons, 'arrowLeftWithBar')}
    }
    [dir="rtl"] .ht-page-navigation-section .ht-page-first::before {
      ${icon(icons, 'arrowRightWithBar')}
    }

    .ht-page-navigation-section .ht-page-prev::before {
      ${icon(icons, 'arrowLeft')}
    }
    [dir="rtl"] .ht-page-navigation-section .ht-page-prev::before {
      ${icon(icons, 'arrowRight')}
    }

    .ht-page-navigation-section .ht-page-next::before {
      ${icon(icons, 'arrowRight')}
    }
    [dir="rtl"] .ht-page-navigation-section .ht-page-next::before {
      ${icon(icons, 'arrowLeft')}
    }

    .ht-page-navigation-section .ht-page-last::before {
      ${icon(icons, 'arrowRightWithBar')}
    }
    [dir="rtl"] .ht-page-navigation-section .ht-page-last::before {
      ${icon(icons, 'arrowLeftWithBar')}
    }

    .htDropdownMenu table tbody tr td .htItemWrapper span.selected::after,
    .htContextMenu table tbody tr td .htItemWrapper span.selected::after,
    .htFiltersConditionsMenu table tbody tr td .htItemWrapper span.selected::after {
      ${icon(icons, 'check')}
    }

    .htCheckboxRendererInput {
      appearance: none;
    }
    .htCheckboxRendererInput::after {
      ${icon(icons, 'checkbox')}
    }

    th.beforeHiddenColumn::after {
      ${icon(icons, 'caretHiddenLeft')}
    }
    th.afterHiddenColumn::before {
      ${icon(icons, 'caretHiddenRight')}
    }
    th.beforeHiddenRow::after {
      ${icon(icons, 'caretHiddenUp')}
    }
    th.afterHiddenRow::before {
      ${icon(icons, 'caretHiddenDown')}
    }

    .collapsibleIndicator::before,
    .ht_nestingButton::before {
      ${icon(icons, 'collapseOff')}
    }
    .collapsibleIndicator.collapsed::before,
    .ht_nestingButton.ht_nestingExpand::before {
      ${icon(icons, 'collapseOn')}
    }

    .htUIRadio > input[type="radio"]::after {
      ${icon(icons, 'radio')}
    }
  `;
};
