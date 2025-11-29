import { createSignal, createEffect } from 'solid-js';
import type { FileType, ImportMapType } from '../types/sandbox';
import type { Compiler } from '../compilers/types';

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

  const runCode = async () => {
    setIsLoading(true);
    const compiled = await compileCode();
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
