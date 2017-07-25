export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name: 'Copy',
    callback() {
      copyPastePlugin.setCopyableText();
      copyPastePlugin.copy(true);
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
