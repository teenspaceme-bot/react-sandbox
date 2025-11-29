import { useBaseSandbox } from '../hooks/useBaseSandbox';
import { reactCompiler } from '../compilers/react.compiler';
import { reactTemplate } from '../utils/templates';
import { BaseSandbox } from './BaseSandbox';

export function ReactSandbox() {
  const sandbox = useBaseSandbox({
    initialFiles: reactTemplate.files,
    initialImportMap: reactTemplate.importMap,
    compiler: reactCompiler
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
      frameworkName="React"
      addFilePrompt="Enter file name (e.g., Component.jsx):"
    />
  );
}
