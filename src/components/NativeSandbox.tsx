import { useBaseSandbox } from '../hooks/useBaseSandbox';
import { nativeCompiler } from '../compilers/native.compiler';
import { nativeTemplate } from '../utils/templates';
import { BaseSandbox } from './BaseSandbox';

interface NativeSandboxProps {
  frameworkButtons?: any;
}

export function NativeSandbox(props: NativeSandboxProps) {
  const sandbox = useBaseSandbox({
    initialFiles: nativeTemplate.files,
    initialImportMap: nativeTemplate.importMap,
    compiler: nativeCompiler
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
      frameworkName="Native JS"
      addFilePrompt="Enter file name (e.g., utils.js, styles.css):"
      frameworkButtons={props.frameworkButtons}
    />
  );
}
