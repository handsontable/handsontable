export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name: 'Copy',
    callback() {
      copyPastePlugin.copy();
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
