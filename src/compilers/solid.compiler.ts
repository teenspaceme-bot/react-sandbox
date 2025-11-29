import type { Compiler } from './types';
import type { FileType } from '../types/sandbox';

let babelInstance: typeof import('@babel/standalone') | null = null;
let jsxPlugin: any = null;

async function loadBabel() {
  if (!babelInstance) {
    babelInstance = await import('@babel/standalone');
    jsxPlugin = await import('babel-plugin-jsx-dom-expressions');
  }
  return babelInstance;
}

export const solidCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

    if (isJSXOrTSX) {
      const babel = await loadBabel();
      const result = babel.transform(file.content, {
        plugins: [
          [jsxPlugin.default || jsxPlugin, {
            moduleName: 'solid-js/web',
            generate: 'dom',
            hydratable: false,
            delegateEvents: true,
            builtIns: ['For', 'Show', 'Switch', 'Match', 'Suspense', 'SuspenseList', 'Portal', 'Index', 'Dynamic', 'ErrorBoundary'],
            contextToCustomElements: true,
            wrapConditionals: true
          }],
          function() {
            return {
              visitor: {
                ImportDeclaration(path: any) {
                  const source = path.node.source.value;
                  if (source.startsWith('./') || source.startsWith('../')) {
                    const newSource = source.replace(/^\.\//, '').replace(/\.(jsx|tsx|js|ts)$/, '');
                    path.node.source.value = newSource;
                  }
                }
              }
            };
          }
        ],
        filename: file.name
      });
      return result.code || '';
    }

    return file.content;
  }
};
