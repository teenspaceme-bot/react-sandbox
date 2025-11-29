import { createSignal, createEffect, For, Show } from 'solid-js';
import type { FileType, ImportMapType, FrameworkType } from '../types/sandbox';
import { compileReactFile, compileVueFile } from '../utils/compilers';
import { reactTemplate, vueTemplate } from '../utils/templates';
import './WebSandbox.css';

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

export function WebSandbox() {
  const [framework, setFramework] = createSignal<FrameworkType>('react');
  const [files, setFiles] = createSignal<FileType[]>(reactTemplate.files);
  const [activeFileIndex, setActiveFileIndex] = createSignal(0);
  const [importMap, setImportMap] = createSignal<ImportMapType>(reactTemplate.importMap);
  const [error, setError] = createSignal<string>('');
  const [iframeKey, setIframeKey] = createSignal(0);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(new Set(['root', 'src', 'src/components']));
  const [viewMode, setViewMode] = createSignal<'code' | 'preview'>('code');
  const [isLoading, setIsLoading] = createSignal(false);

  const activeFile = () => files()[activeFileIndex()];

  const switchFramework = (newFramework: FrameworkType) => {
    if (confirm(`Switch to ${newFramework.toUpperCase()}? This will reset your current work.`)) {
      setFramework(newFramework);
      const template = newFramework === 'react' ? reactTemplate : vueTemplate;
      setFiles(template.files);
      setImportMap(template.importMap);
      setActiveFileIndex(0);
      setError('');
    }
  };

  const updateFileContent = (content: string) => {
    const index = activeFileIndex();
    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, content } : f
    ));
  };

  const addFile = () => {
    const name = prompt(
      framework() === 'react'
        ? 'Enter file name (e.g., Component.jsx):'
        : 'Enter file name (e.g., Component.vue):'
    );
    if (name) {
      let language: FileType['language'] = 'javascript';

      if (framework() === 'react') {
        language = name.endsWith('.tsx') ? 'tsx' :
                  name.endsWith('.ts') ? 'typescript' :
                  name.endsWith('.jsx') ? 'jsx' : 'javascript';
      } else {
        language = name.endsWith('.vue') ? 'vue' : 'javascript';
      }

      setFiles([...files(), { name, content: '', language }]);
      setActiveFileIndex(files().length - 1);
    }
  };

  const deleteFile = (index: number) => {
    if (files().length > 1) {
      setFiles(prev => prev.filter((_, i) => i !== index));
      if (activeFileIndex() >= index && activeFileIndex() > 0) {
        setActiveFileIndex(activeFileIndex() - 1);
      }
    }
  };

  const buildFileTree = (): TreeNode[] => {
    const root: TreeNode[] = [];
    const folderMap = new Map<string, FolderNode>();

    files().forEach((file, index) => {
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
              expanded: expandedFolders().has(currentPath)
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

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    if (node.type === 'file') {
      return (
        <div
          class={`file-item ${node.fileIndex === activeFileIndex() ? 'active' : ''}`}
          onClick={() => setActiveFileIndex(node.fileIndex)}
          style={{ 'padding-left': `${depth * 16 + 12}px` }}
        >
          <span class="file-icon">📄</span>
          <span class="file-name">{node.name}</span>
          <Show when={files().length > 1}>
            <button
              class="delete-file"
              onClick={(e) => {
                e.stopPropagation();
                deleteFile(node.fileIndex);
              }}
              title="Delete file"
            >
              ×
            </button>
          </Show>
        </div>
      );
    } else {
      const isExpanded = expandedFolders().has(node.path);
      return (
        <>
          <div
            class="folder-item"
            onClick={() => toggleFolder(node.path)}
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

  const compileCode = () => {
    try {
      setError('');
      const compiledFiles: Record<string, string> = {};

      files().forEach(file => {
        try {
          if (framework() === 'react') {
            compiledFiles[file.name] = compileReactFile(file);
          } else if (framework() === 'vue') {
            compiledFiles[file.name] = compileVueFile(file);
          } else {
            compiledFiles[file.name] = file.content;
          }
        } catch (err: any) {
          throw new Error(`Error compiling ${file.name}: ${err.message}`);
        }
      });

      return compiledFiles;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const runCode = () => {
    setIsLoading(true);
    const compiled = compileCode();
    if (!compiled) {
      setIsLoading(false);
      return;
    }

    const html = generateHTML(compiled, importMap());
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    setIframeKey(prev => prev + 1);

    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe) {
        const oldSrc = iframe.src;
        if (oldSrc && oldSrc.startsWith('blob:')) {
          URL.revokeObjectURL(oldSrc);
        }
        iframe.src = url;
        iframe.onload = () => {
          setIsLoading(false);
        };
      }
    }, 0);
  };

  const generateHTML = (compiledFiles: Record<string, string>, importMap: ImportMapType): string => {
    const dataUrls: Record<string, string> = {};

    Object.entries(compiledFiles).forEach(([name, code]) => {
      const transformedCode = code.replace(/from\s+['"]\.\//g, "from '");
      const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedCode)}`;

      dataUrls[name] = dataUrl;

      const nameWithoutExt = name.replace(/\.(jsx|tsx|js|ts|vue)$/, '');
      dataUrls[nameWithoutExt] = dataUrl;

      if (name.startsWith('src/')) {
        const nameWithoutSrc = name.replace(/^src\//, '');
        dataUrls[nameWithoutSrc] = dataUrl;
        const nameWithoutSrcExt = nameWithoutSrc.replace(/\.(jsx|tsx|js|ts|vue)$/, '');
        dataUrls[nameWithoutSrcExt] = dataUrl;
      }
    });

    const htmlFile = files().find(f => f.name === 'index.html');
    let html = htmlFile?.content || '';

    const importMapMatch = html.match(/<script type="importmap">\s*([\s\S]*?)\s*<\/script>/);
    let existingImports = {};

    if (importMapMatch && importMapMatch[1]) {
      try {
        const parsed = JSON.parse(importMapMatch[1]);
        existingImports = parsed.imports || {};
      } catch (e) {
        existingImports = importMap.imports;
      }
    } else {
      existingImports = importMap.imports;
    }

    const customImportMap = {
      imports: {
        ...existingImports,
        ...dataUrls
      }
    };

    if (importMapMatch) {
      html = html.replace(
        /<script type="importmap">[\s\S]*?<\/script>/,
        `<script type="importmap">\n${JSON.stringify(customImportMap, null, 2)}\n  </script>`
      );
    } else {
      html = html.replace(
        /<\/head>/,
        `  <script type="importmap">\n${JSON.stringify(customImportMap, null, 2)}\n  </script>\n</head>`
      );
    }

    html = html.replace(
      /<script\s+type="module"\s+src="([^"]+)"><\/script>/g,
      (match, src) => {
        const cleanSrc = src.replace(/^\.\//, '');
        const dataUrl = dataUrls[cleanSrc];
        if (dataUrl) {
          return `<script type="module" src="${dataUrl}"></script>`;
        }
        return match;
      }
    );

    return html;
  };

  createEffect(() => {
    runCode();
  });

  return (
    <div class="sandbox-container">
      <div class="sandbox-header">
        <div class="header-left">
          <button
            class={`view-toggle-button ${framework() === 'react' ? 'active' : ''}`}
            onClick={() => switchFramework('react')}
          >
            React
          </button>
          <button
            class={`view-toggle-button ${framework() === 'vue' ? 'active' : ''}`}
            onClick={() => switchFramework('vue')}
          >
            Vue
          </button>
          <button
            class={`view-toggle-button ${viewMode() === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
          >
            Code
          </button>
          <button
            class={`view-toggle-button ${viewMode() === 'preview' ? 'active' : ''}`}
            onClick={() => {
              setViewMode('preview');
              runCode();
            }}
          >
            Preview
          </button>
        </div>
        <div class="header-right">
          <Show when={viewMode() === 'code'}>
            <span class="current-file">📄 {activeFile().name}</span>
          </Show>
          <Show when={viewMode() === 'preview'}>
            <button onClick={runCode} class="refresh-button" title="Refresh preview">↻</button>
          </Show>
        </div>
      </div>

      <div class="sandbox-content">
        <Show when={viewMode() === 'code'}>
          <div class="file-explorer">
            <div class="file-tree">
              <For each={buildFileTree()}>
                {(node) => renderTreeNode(node, 0)}
              </For>
            </div>
            <button class="add-file-button" onClick={addFile}>
              <span class="add-icon">+</span> New File
            </button>
          </div>
        </Show>

        <Show when={viewMode() === 'code'}>
          <div class="editor-panel">
            <textarea
              class="code-editor"
              value={activeFile().content}
              onInput={(e) => updateFileContent(e.currentTarget.value)}
              spellcheck={false}
            />

            <Show when={error()}>
              <div class="error-message">
                <strong>Error:</strong> {error()}
              </div>
            </Show>
          </div>
        </Show>

        <Show when={viewMode() === 'preview'}>
          <div class="preview-panel preview-fullscreen">
            <Show when={isLoading()}>
              <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
              </div>
            </Show>
            <iframe
              id="preview-iframe"
              data-key={iframeKey()}
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
            value={JSON.stringify(importMap(), null, 2)}
            onInput={(e) => {
              try {
                const parsed = JSON.parse(e.currentTarget.value);
                setImportMap(parsed);
              } catch {}
            }}
            spellcheck={false}
          />
        </details>
      </div>
    </div>
  );
}
