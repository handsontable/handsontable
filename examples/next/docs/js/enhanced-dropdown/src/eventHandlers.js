function onAddColumButton() {
  const hot = document.getElementById('dropdown-new').hot
  const settings = hot.getSettings()
  settings.columns.splice(1, 0, { data: settings.columns.length, type: "text" })
  settings.colHeaders.splice(1, 0, 'New Column')
  settings.colWidths.splice(1, 0, 100)
  hot.updateSettings(settings)
}

function onRemoveColumButton() {
  const hot = document.getElementById('dropdown-new').hot
  const settings = hot.getSettings()
  settings.columns.splice(1, 1)
  settings.colHeaders.splice(1, 1)
  settings.colWidths.splice(1, 1)
  hot.updateSettings(settings)
}

function onAddRowButton() {
}

function onRemoveRowButton() {
}

document.getElementById('addColumButton').addEventListener('click', onAddColumButton)
document.getElementById('removeColumButton').addEventListener('click', onRemoveColumButton)
document.getElementById('addRowButton').addEventListener('click', onAddRowButton)
document.getElementById('removeRowButton').addEventListener('click', onRemoveRowButton)
