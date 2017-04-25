class CellModifications {

  static applySpan(TD, rowspan, colspan) {
    if (rowspan != null) {
      TD.setAttribute('rowspan', rowspan);
    }
    if (colspan != null) {
      TD.setAttribute('colspan', colspan);
    }
  }

}