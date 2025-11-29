import { useBaseSandbox } from '../hooks/useBaseSandbox';
import { vueCompiler } from '../compilers/vue.compiler';
import { vueTemplate } from '../utils/templates';
import { BaseSandbox } from './BaseSandbox';

export function VueSandbox() {
  const sandbox = useBaseSandbox({
    initialFiles: vueTemplate.files,
    initialImportMap: vueTemplate.importMap,
    compiler: vueCompiler
  });

  return (
    <BaseSandbox
      files={sandbox.files}
      activeFileIndex={sandbox.activeFileIndex}
      setActiveFileIndex={sandbox.setActiveFileIndex}
      importMap={sandbox.importMap}
      setImportMap={sandbox.setImportMap}
      error={sandbox.error}
      iframeKey={sandbox.iframeKey}
      expandedFolders={sandbox.expandedFolders}
      isLoading={sandbox.isLoading}
      activeFile={sandbox.activeFile}
      updateFileContent={sandbox.updateFileContent}
      addFile={sandbox.addFile}
      deleteFile={sandbox.deleteFile}
      toggleFolder={sandbox.toggleFolder}
      runCode={sandbox.runCode}
      frameworkName="Vue"
      addFilePrompt="Enter file name (e.g., Component.vue):"
    />
  );
}
