function drawIndexesTable(instance) {
  const nrOfRows = instance.countSourceRows();

  document.querySelector('#indexes > table').innerHTML = '';

  const header = document.createElement('tr');

  const columnHeader1 = document.createElement('th');
  const columnHeader2 = document.createElement('th');

  columnHeader1.textContent = 'visual index';
  columnHeader2.textContent = 'physical index';

  document.querySelector('#indexes > table').appendChild(header);

  for (let visualIndex = 0; visualIndex < nrOfRows; visualIndex += 1) {
    const physicalIndex = instance.runHooks('modifyRow', visualIndex);

    header.appendChild(columnHeader1);
    header.appendChild(columnHeader2);

    const row = document.createElement('tr');

    const firstColumn = document.createElement('td');
    firstColumn.textContent = visualIndex;

    const secondColumn = document.createElement('td');
    secondColumn.textContent = physicalIndex;

    row.appendChild(firstColumn);
    row.appendChild(secondColumn);

    document.querySelector('#indexes > table').appendChild(row);
  }
}
