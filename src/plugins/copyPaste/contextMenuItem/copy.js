export default function copyItem(copyPastePlugin) {
  return {
    key: 'copy',
    name: 'Copy',
    callback() {
      copyPastePlugin.textarea.select();
      copyPastePlugin.setCopyableText();
      copyPastePlugin.copy();
    },
    disabled() {
      return !copyPastePlugin.hot.getSelected();
    },
    hidden: false
  };
}
