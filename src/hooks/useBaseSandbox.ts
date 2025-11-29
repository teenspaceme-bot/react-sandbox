import { createSignal, createEffect, onMount } from 'solid-js';
import type { FileType, ImportMapType } from '../types/sandbox';
import type { Compiler } from '../compilers/types';
import { FETCH_INTERCEPTOR } from '../utils/templates';
import { ensureServiceWorkerReady, updateServiceWorkerFiles } from '../utils/sw-manager';

export interface BaseSandboxConfig {
  initialFiles: FileType[];
  initialImportMap: ImportMapType;
  compiler: Compiler;
}

export function useBaseSandbox(config: BaseSandboxConfig) {
  const [files, setFiles] = createSignal<FileType[]>(config.initialFiles);
  const [activeFileIndex, setActiveFileIndex] = createSignal(0);
  const [importMap, setImportMap] = createSignal<ImportMapType>(config.initialImportMap);
  const [error, setError] = createSignal<string>('');
  const [iframeKey, setIframeKey] = createSignal(0);
  const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(new Set(['root', 'src', 'src/components']));
  const [viewMode, setViewMode] = createSignal<'code' | 'preview'>('code');
  const [isLoading, setIsLoading] = createSignal(false);
  const [blobUrls, setBlobUrls] = createSignal<string[]>([]);

  // Initialize Service Worker on mount
  onMount(() => {
    ensureServiceWorkerReady().catch(err => {
      console.error('[Sandbox] Failed to initialize Service Worker:', err);
    });
  });

  createEffect(() => {
    setFiles(config.initialFiles);
    setActiveFileIndex(0);
    setImportMap(config.initialImportMap);
    setError('');
    setViewMode('code');
  });

  const activeFile = () => files()[activeFileIndex()];

  const updateFileContent = (content: string) => {
    const index = activeFileIndex();
    setFiles(prev => prev.map((f, i) =>
      i === index ? { ...f, content } : f
    ));
  };

  const addFile = (namePrompt: string) => {
    const name = prompt(namePrompt);
    if (name) {
      let language: FileType['language'] = 'javascript';

      if (name.endsWith('.tsx')) language = 'tsx';
      else if (name.endsWith('.ts')) language = 'typescript';
      else if (name.endsWith('.jsx')) language = 'jsx';
      else if (name.endsWith('.vue')) language = 'vue';
      else if (name.endsWith('.html')) language = 'html';

      setFiles([...files(), { name, content: '', language }]);
      setActiveFileIndex(files().length);
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

  const compileCode = async () => {
    try {
      setError('');
      const compiledFiles: Record<string, string> = {};

      for (const file of files()) {
        try {
          compiledFiles[file.name] = await config.compiler.compile(file);
        } catch (err: any) {
          throw new Error(`Error compiling ${file.name}: ${err.message}`);
        }
      }

      return compiledFiles;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const generateHTML = (compiledFiles: Record<string, string>, importMap: ImportMapType): string => {
    blobUrls().forEach(url => URL.revokeObjectURL(url));
    setBlobUrls([]);

    // Send compiled files to Service Worker
    updateServiceWorkerFiles(compiledFiles);

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

    // Generate import map with Service Worker URLs
    const moduleUrls: Record<string, string> = {};
    const swBaseUrl = `${window.location.origin}/__sandbox_module__/`;

    Object.entries(compiledFiles).forEach(([name]) => {
      if (!name.endsWith('.html')) {
        const modulePath = name.replace(/^src\//, './');
        moduleUrls[modulePath] = `${swBaseUrl}${encodeURIComponent(modulePath)}`;

        // Also map without extension
        const withoutExt = modulePath.replace(/\.(jsx|tsx|js|ts|vue)$/, '');
        moduleUrls[withoutExt] = `${swBaseUrl}${encodeURIComponent(modulePath)}`;
      }
    });

    const customImportMap = {
      imports: {
        ...existingImports,
        ...moduleUrls
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
      (_match, src) => {
        const modulePath = src.replace(/^\.\//, './');
        return `<script type="module" src="${swBaseUrl}${encodeURIComponent(modulePath)}"></script>`;
      }
    );

    // Inject fetch interceptor before any other scripts
    const injectedScripts = `
  <script>
${FETCH_INTERCEPTOR}
  </script>
`;

    html = html.replace(/<\/head>/i, `${injectedScripts}</head>`);

    return html;
  };

  const runCode = async () => {
    setIsLoading(true);

    // Ensure Service Worker is ready first
    await ensureServiceWorkerReady();

    let html: string;
    let compiledFiles: Record<string, string> = {};

    if (config.compiler.compileAll) {
      try {
        setError('');
        html = await config.compiler.compileAll(files(), importMap());
      } catch (err: any) {
        setError(err.message);
        setIsLoading(false);
        return;
      }
    } else {
      const compiled = await compileCode();
      if (!compiled) {
        setIsLoading(false);
        return;
      }
      compiledFiles = compiled;
      html = generateHTML(compiled, importMap());
    }

    setIframeKey(prev => prev + 1);

    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe) {
        // Use sandbox-frame.html instead of blob URL
        iframe.src = '/sandbox-frame.html';

        iframe.onload = () => {
          // Send code to iframe via postMessage
          iframe.contentWindow?.postMessage({
            type: 'RUN_CODE',
            html: html,
            files: compiledFiles
          }, '*');
        };
      }

      // Listen for messages from iframe
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'CODE_EXECUTED') {
          setIsLoading(false);
        } else if (event.data.type === 'SW_READY') {
          console.log('[Sandbox] iframe Service Worker ready');
        } else if (event.data.type === 'SW_ERROR') {
          console.error('[Sandbox] iframe Service Worker error:', event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);
    }, 0);
  };

  createEffect(() => {
    runCode();
  });

  return {
    files,
    setFiles,
    activeFileIndex,
    setActiveFileIndex,
    importMap,
    setImportMap,
    error,
    iframeKey,
    expandedFolders,
    viewMode,
    setViewMode,
    isLoading,
    activeFile,
    updateFileContent,
    addFile,
    deleteFile,
    toggleFolder,
    runCode
  };
}
