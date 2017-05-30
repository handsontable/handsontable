export default function pasteItem(copyPastePlugin) {
  return {
    key: 'paste',
    name: 'Paste',
    callback() {
      copyPastePlugin.paste(true);
      // alert('Unfortunately, this option is unavailable from contextmenu level.\nYou have to use keyboard shortcut.')
    },
    disabled: false,
    hidden: false
  };
}
