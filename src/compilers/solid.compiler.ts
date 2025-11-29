import type { Compiler } from './types';
import type { FileType } from '../types/sandbox';

let babelInstance: typeof import('@babel/standalone') | null = null;
let presetRegistered = false;

async function loadBabel() {
  if (!babelInstance) {
    babelInstance = await import('@babel/standalone');

    if (!presetRegistered) {
      const presetSolid = await import('babel-preset-solid');
      babelInstance.registerPreset('solid', presetSolid.default || presetSolid);
      presetRegistered = true;
    }
  }
  return babelInstance;
}

export const solidCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

    if (isJSXOrTSX) {
      const babel = await loadBabel();
      const result = babel.transform(file.content, {
        presets: [
          ['solid', {
            moduleName: 'solid-js/web',
            generate: 'dom'
          }]
        ],
        filename: file.name
      });
      return result.code || '';
    }

    return file.content;
  }
};
