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
    \${JSON.stringify(customImportMap, null, 2)}
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
  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from 'App.jsx';

    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div style="padding: 20px; color: red; font-family: monospace;">' +
        '<h3>Runtime Error:</h3><pre>' + err.message + '</pre></div>';
      console.error(err);
    }
  </script>
</body>
</html>`,
    language: 'html'
  },
  {
    name: 'App.jsx',
    content: `import React, { useState } from 'react';
import { Button } from './Button';
import { Card } from './Card';

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
    name: 'Button.jsx',
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
    name: 'Card.jsx',
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

export function ReactSandbox() {
  const [files, setFiles] = createSignal<FileType[]>(defaultFiles);
  const [activeFileIndex, setActiveFileIndex] = createSignal(0);
  const [importMap, setImportMap] = createSignal<ImportMapType>(defaultImportMap);
  const [error, setError] = createSignal<string>('');
  const [iframeKey, setIframeKey] = createSignal(0);

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
      if (name === 'index.html') return;

      const transformedCode = code.replace(/from\s+['"]\.\//g, "from '");

      const dataUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedCode)}`;
      dataUrls[name] = dataUrl;
      const nameWithoutExt = name.replace(/\.(jsx|tsx|js|ts)$/, '');
      dataUrls[nameWithoutExt] = dataUrl;
    });

    const htmlFile = files().find(f => f.name === 'index.html');
    if (htmlFile) {
      let htmlContent = htmlFile.content;

      const importMapMatch = htmlContent.match(/<script\s+type=["']importmap["']>\s*(\{[\s\S]*?\})\s*<\/script>/i);
      let userImportMap: any = { imports: {} };

      if (importMapMatch) {
        try {
          userImportMap = JSON.parse(importMapMatch[1]);
        } catch (e) {
          console.error('Failed to parse user import map:', e);
        }
      }

      const mergedImportMap = {
        imports: {
          ...importMap.imports,
          ...userImportMap.imports,
          ...dataUrls
        }
      };

      htmlContent = htmlContent.replace(
        /<script\s+type=["']importmap["']>\s*\{[\s\S]*?\}\s*<\/script>/i,
        `<script type="importmap">\n${JSON.stringify(mergedImportMap, null, 2)}\n</script>`
      );

      htmlContent = htmlContent.replace(
        /<script\s+type=["']module["']\s+src=["']([^"']+)["']><\/script>/gi,
        (match, src) => {
          const cleanPath = src.replace(/^\//, '');
          const fileKey = dataUrls[cleanPath] || dataUrls[cleanPath.replace(/\.(jsx|tsx|js|ts)$/, '')];

          if (fileKey) {
            return `<script type="module" src="${fileKey}"></script>`;
          }
          return match;
        }
      );

      return htmlContent;
    }

    const customImportMap = {
      imports: {
        ...importMap.imports,
        ...dataUrls
      }
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    ${JSON.stringify(customImportMap, null, 2)}
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
  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from 'App.jsx';

    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (err) {
      document.getElementById('root').innerHTML =
        '<div style="padding: 20px; color: red; font-family: monospace;">' +
        '<h3>Runtime Error:</h3><pre>' + err.message + '</pre></div>';
      console.error(err);
    }
  </script>
</body>
</html>`;
  };

  createEffect(() => {
    runCode();
  });

  return (
    <div class="sandbox-container">
      <div class="sandbox-header">
        <h2>React Sandbox</h2>
        <button onClick={runCode} class="run-button">▶ Run</button>
      </div>

      <div class="sandbox-content">
        <div class="file-explorer">
          <div class="explorer-header">FILES</div>
          <div class="file-tree">
            <div class="folder-item">
              <span class="folder-icon">📁</span>
              <span class="folder-name">src</span>
            </div>
            <div class="folder-content">
              <For each={files()}>
                {(file, i) => (
                  <div
                    class={`file-item ${i() === activeFileIndex() ? 'active' : ''}`}
                    onClick={() => setActiveFileIndex(i())}
                  >
                    <span class="file-icon">📄</span>
                    <span class="file-name">{file.name}</span>
                    <Show when={files().length > 1}>
                      <button
                        class="delete-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFile(i());
                        }}
                        title="Delete file"
                      >
                        ×
                      </button>
                    </Show>
                  </div>
                )}
              </For>
            </div>
            <button class="add-file-button" onClick={addFile}>
              <span class="add-icon">+</span> New File
            </button>
          </div>
        </div>

        <div class="editor-panel">
          <div class="editor-header">
            <span class="current-file">📄 {activeFile().name}</span>
          </div>

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

        <div class="preview-panel">
          <div class="preview-header">Preview</div>
          <iframe
            id="preview-iframe"
            data-key={iframeKey()}
            class="preview-iframe"
            sandbox="allow-scripts allow-modals"
          />
        </div>
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
