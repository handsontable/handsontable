export function arrayToTable(input) {
  const inputLen = input.length;
  const result = ['<table>'];

  const tempElement = document.createElement('div');
  document.documentElement.appendChild(tempElement);

  for (let row = 0; row < inputLen; row += 1) {
    const rowData = input[row];
    const columnsLen = rowData.length;
    const columnsResult = [];

    if (row === 0) {
      result.push('<tbody>');
    }

    for (let column = 0; column < columnsLen; column += 1) {
      tempElement.innerHTML = `${rowData[column]}`;

      columnsResult.push(`<td>${tempElement.innerHTML}</td>`);
    }

    result.push('<tr>', ...columnsResult, '</tr>');

    if (row + 1 === inputLen) {
      result.push('</tbody>');
    }
  }

  document.documentElement.removeChild(tempElement);

  result.push('</table>');

  return result.join('');
}

export function isHTMLTable(element) {
  return (element && element.nodeName || '').toLowerCase() === 'table';
}

function htmlTableToArray(table) {
  const rows = table.rows;
  const rowsLen = rows && rows.length;
  const tempArray = [];

  for (let row = 0; row < rowsLen; row += 1) {
    const cells = rows[row].cells;
    const cellsLen = cells.length;
    const newRow = [];

    for (let column = 0; column < cellsLen; column += 1) {
      const cell = cells[column];
      const cellText = cell.innerHTML;
      newRow.push(cellText);
    }

    tempArray.push(newRow);
  }

  return tempArray;
}

export function tableToArray(element) {
  const result = [];
  let checkElement = element;

  if (typeof checkElement === 'string') {
    const tempElem = document.createElement('div');
    tempElem.innerHTML = checkElement.replace(/\n/g, '');

    checkElement = tempElem.querySelector('table');
  }

  if (checkElement && isHTMLTable(checkElement)) {
    result.push(...htmlTableToArray(checkElement));
  }

  return result;
}
