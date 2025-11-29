import { useBaseSandbox } from '../hooks/useBaseSandbox';
import { solidCompiler } from '../compilers/solid.compiler';
import { solidTemplate } from '../utils/templates';
import { BaseSandbox } from './BaseSandbox';

interface SolidSandboxProps {
  frameworkButtons?: any;
}

export function SolidSandbox(props: SolidSandboxProps) {
  const sandbox = useBaseSandbox({
    initialFiles: solidTemplate.files,
    initialImportMap: solidTemplate.importMap,
    compiler: solidCompiler
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
      viewMode={sandbox.viewMode}
      setViewMode={sandbox.setViewMode}
      isLoading={sandbox.isLoading}
      activeFile={sandbox.activeFile}
      updateFileContent={sandbox.updateFileContent}
      addFile={sandbox.addFile}
      deleteFile={sandbox.deleteFile}
      toggleFolder={sandbox.toggleFolder}
      runCode={sandbox.runCode}
      frameworkName="SolidJS"
      addFilePrompt="Enter file name (e.g., Component.jsx):"
      frameworkButtons={props.frameworkButtons}
    />
  );
}
