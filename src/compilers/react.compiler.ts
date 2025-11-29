import type { Compiler } from './types';
import type { FileType } from '../types/sandbox';

let babelInstance: typeof import('@babel/standalone') | null = null;

async function loadBabel() {
  if (!babelInstance) {
    babelInstance = await import('@babel/standalone');
  }
  return babelInstance;
}

export const reactCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

    if (isJSXOrTSX) {
      const babel = await loadBabel();
      const result = babel.transform(file.content, {
        presets: [['react', { runtime: 'classic' }]],
        filename: file.name
      });
      return result.code || '';
    }

    return file.content;
  }
};
