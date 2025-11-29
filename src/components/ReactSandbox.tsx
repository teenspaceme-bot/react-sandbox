import { createSignal, createEffect, For, Show } from 'solid-js';
import { transform } from '@babel/standalone';
import type { FileType, ImportMapType } from '../types/sandbox';
import './ReactSandbox.css';

const defaultFiles: FileType[] = [
  {
    name: 'index.html',
    content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "react/": "https://esm.sh/react@18.2.0/",
        "lucide-react": "https://esm.sh/lucide-react@0.330.0",
        "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/index.jsx"></script>
</body>
</html>`,
    language: 'html'
  },
  {
    name: 'src/index.jsx',
    content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    language: 'jsx'
  },
  {
    name: 'src/App.jsx',
    content: `import React, { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>React Sandbox Demo</h1>
      <Card title="Counter Example">
        <p>Count: {count}</p>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
        <Button onClick={() => setCount(count - 1)}>
          Decrement
        </Button>
      </Card>
    </div>
  );
}

export default App;`,
    language: 'jsx'
  },
  {
    name: 'src/components/Button.jsx',
    content: `import React from 'react';

export function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '10px'
      }}
    >
      {children}
    </button>
  );
}`,
    language: 'jsx'
  },
  {
    name: 'src/components/Card.jsx',
    content: `import React from 'react';

export function Card({ title, children }) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '500px'
    }}>
      {title && <h2 style={{ marginTop: 0, color: '#333' }}>{title}</h2>}
      <div>{children}</div>
    </div>
  );
}`,
    language: 'jsx'
  }
];

const defaultImportMap: ImportMapType = {
  imports: {
    'react': 'https://esm.sh/react@18.2.0',
    'react-dom': 'https://esm.sh/react-dom@18.2.0',
    'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client'
  }
};

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

export function ReactSandbox() {
  const [files, setFiles] = createSignal<FileType[]>(defaultFiles);
  const [activeFileIndex, setActiveFileIndex] = createSignal(0);
  const [importMap, setImportMap] = createSignal<ImportMapType>(defaultImportMap);
  const [error, setError] = createSignal<string>('');
  const [iframeKey, setIframeKey] = createSignal(0);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(new Set(['root', 'src', 'src/components']));
  const [viewMode, setViewMode] = createSignal<'code' | 'preview'>('code');

  const activeFile = () => files()[activeFileIndex()];

  const updateFileContent = (content: string) => {
    const index = activeFileIndex();
    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, content } : f
    ));
  };

  const addFile = () => {
    const name = prompt('Enter file name (e.g., Component.jsx):');
    if (name) {
      const language = name.endsWith('.tsx') ? 'tsx' :
                      name.endsWith('.ts') ? 'typescript' :
                      name.endsWith('.jsx') ? 'jsx' : 'javascript';
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
          const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

          if (isJSXOrTSX) {
            const result = transform(file.content, {
              presets: [['react', { runtime: 'classic' }]],
              filename: file.name
            });
            compiledFiles[file.name] = result.code || '';
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
    const compiled = compileCode();
    if (!compiled) return;

    const html = generateHTML(compiled, importMap());
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    setIframeKey(prev => prev + 1);

    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe) {
        // Revoke old URL if it exists
        const oldSrc = iframe.src;
        if (oldSrc && oldSrc.startsWith('blob:')) {
          URL.revokeObjectURL(oldSrc);
        }
        iframe.src = url;
      }
    }, 0);
  };

  const generateHTML = (compiledFiles: Record<string, string>, importMap: ImportMapType): string => {
    const dataUrls: Record<string, string> = {};

    Object.entries(compiledFiles).forEach(([name, code]) => {
      const transformedCode = code.replace(/from\s+['"]\.\//g, "from '");
      const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedCode)}`;

      dataUrls[name] = dataUrl;

      const nameWithoutExt = name.replace(/\.(jsx|tsx|js|ts)$/, '');
      dataUrls[nameWithoutExt] = dataUrl;

      if (name.startsWith('src/')) {
        const nameWithoutSrc = name.replace(/^src\//, '');
        dataUrls[nameWithoutSrc] = dataUrl;
        const nameWithoutSrcExt = nameWithoutSrc.replace(/\.(jsx|tsx|js|ts)$/, '');
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
            class={`view-toggle-button ${viewMode() === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
          >
            Code
          </button>
          <button
            class={`view-toggle-button ${viewMode() === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
          >
            Preview
          </button>
        </div>
        <div class="header-right">
          <Show when={viewMode() === 'code'}>
            <span class="current-file">📄 {activeFile().name}</span>
          </Show>
          <Show when={viewMode() === 'preview'}>
            <button onClick={runCode} class="run-button">▶ Run</button>
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
