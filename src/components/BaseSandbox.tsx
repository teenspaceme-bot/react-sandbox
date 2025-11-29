import { For, Show } from 'solid-js';
import type { FileType } from '../types/sandbox';
import './BaseSandbox.css';

interface FolderNode {
  name: string;
  path: string;
  type: 'folder';
  children: (FolderNode | FileNode)[];
  expanded: boolean;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file';
  fileIndex: number;
}

type TreeNode = FolderNode | FileNode;

interface BaseSandboxProps {
  files: () => FileType[];
  activeFileIndex: () => number;
  setActiveFileIndex: (index: number) => void;
  importMap: () => any;
  setImportMap: (map: any) => void;
  error: () => string;
  iframeKey: () => number;
  expandedFolders: () => Set<string>;
  viewMode: () => 'code' | 'preview';
  setViewMode: (mode: 'code' | 'preview') => void;
  isLoading: () => boolean;
  activeFile: () => FileType;
  updateFileContent: (content: string) => void;
  addFile: (prompt: string) => void;
  deleteFile: (index: number) => void;
  toggleFolder: (path: string) => void;
  runCode: () => void;
  frameworkName: string;
  addFilePrompt: string;
  frameworkButtons?: any;
}

export function BaseSandbox(props: BaseSandboxProps) {
  const buildFileTree = (): TreeNode[] => {
    const root: TreeNode[] = [];
    const folderMap = new Map<string, FolderNode>();

    props.files().forEach((file, index) => {
      const parts = file.name.split('/');

      if (parts.length === 1) {
        root.push({
          name: file.name,
          path: file.name,
          type: 'file',
          fileIndex: index
        });
      } else {
        let currentPath = '';
        let currentLevel: TreeNode[] = root;

        for (let i = 0; i < parts.length - 1; i++) {
          const folderName = parts[i];
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

          if (!folderMap.has(currentPath)) {
            const folder: FolderNode = {
              name: folderName,
              path: currentPath,
              type: 'folder',
              children: [],
              expanded: props.expandedFolders().has(currentPath)
            };
            folderMap.set(currentPath, folder);
            currentLevel.push(folder);
            currentLevel = folder.children;
          } else {
            currentLevel = folderMap.get(currentPath)!.children;
          }
        }

        currentLevel.push({
          name: parts[parts.length - 1],
          path: file.name,
          type: 'file',
          fileIndex: index
        });
      }
    });

    return root;
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0): any => {
    if (node.type === 'file') {
      return (
        <div
          class={`file-item ${node.fileIndex === props.activeFileIndex() ? 'active' : ''}`}
          onClick={() => props.setActiveFileIndex(node.fileIndex)}
          style={{ 'padding-left': `${depth * 16 + 12}px` }}
        >
          <span class="file-icon">📄</span>
          <span class="file-name">{node.name}</span>
          <Show when={props.files().length > 1}>
            <button
              class="delete-file"
              onClick={(e) => {
                e.stopPropagation();
                props.deleteFile(node.fileIndex);
              }}
              title="Delete file"
            >
              ×
            </button>
          </Show>
        </div>
      );
    } else {
      const isExpanded = props.expandedFolders().has(node.path);
      return (
        <>
          <div
            class="folder-item"
            onClick={() => props.toggleFolder(node.path)}
            style={{ 'padding-left': `${depth * 16 + 12}px` }}
          >
            <span class="folder-icon">{isExpanded ? '📂' : '📁'}</span>
            <span class="folder-name">{node.name}</span>
            <span class="folder-toggle">{isExpanded ? '▼' : '▶'}</span>
          </div>
          <Show when={isExpanded}>
            <For each={node.children}>
              {(child) => renderTreeNode(child, depth + 1)}
            </For>
          </Show>
        </>
      );
    }
  };

  return (
    <div class="sandbox-container">
      <div class="sandbox-header">
        <div class="header-left">
          <button
            class={`view-toggle-button ${props.viewMode() === 'code' ? 'active' : ''}`}
            onClick={() => props.setViewMode('code')}
          >
            Code
          </button>
          <button
            class={`view-toggle-button ${props.viewMode() === 'preview' ? 'active' : ''}`}
            onClick={() => {
              props.setViewMode('preview');
              props.runCode();
            }}
          >
            Preview
          </button>
        </div>
        <div class="header-right">
          <div style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
            <Show when={props.viewMode() === 'code'}>
              <span class="current-file">📄 {props.activeFile().name}</span>
            </Show>
            <Show when={props.viewMode() === 'preview'}>
              <button onClick={props.runCode} class="refresh-button" title="Refresh preview">↻</button>
            </Show>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {props.frameworkButtons}
          </div>
        </div>
      </div>

      <div class="sandbox-content">
        <Show when={props.viewMode() === 'code'}>
          <div class="file-explorer">
            <div class="file-tree">
              <For each={buildFileTree()}>
                {(node) => renderTreeNode(node, 0)}
              </For>
            </div>
            <button class="add-file-button" onClick={() => props.addFile(props.addFilePrompt)}>
              <span class="add-icon">+</span> New File
            </button>
          </div>
        </Show>

        <Show when={props.viewMode() === 'code'}>
          <div class="editor-panel">
            <textarea
              class="code-editor"
              value={props.activeFile().content}
              onInput={(e) => props.updateFileContent(e.currentTarget.value)}
              spellcheck={false}
            />

            <Show when={props.error()}>
              <div class="error-message">
                <strong>Error:</strong> {props.error()}
              </div>
            </Show>
          </div>
        </Show>

        <Show when={props.viewMode() === 'preview'}>
          <div class="preview-panel preview-fullscreen">
            <Show when={props.isLoading()}>
              <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
              </div>
            </Show>
            <iframe
              id="preview-iframe"
              data-key={props.iframeKey()}
              class="preview-iframe"
              sandbox="allow-scripts allow-modals"
            />
          </div>
        </Show>
      </div>

      <div class="import-map-section">
        <details>
          <summary>Import Map Configuration</summary>
          <textarea
            class="import-map-editor"
            value={JSON.stringify(props.importMap(), null, 2)}
            onInput={(e) => {
              try {
                const parsed = JSON.parse(e.currentTarget.value);
                props.setImportMap(parsed);
              } catch {}
            }}
            spellcheck={false}
          />
        </details>
      </div>
    </div>
  );
}
