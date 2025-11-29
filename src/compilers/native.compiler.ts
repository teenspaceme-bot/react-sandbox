import type { Compiler } from './types';
import type { FileType } from '../types/sandbox';

export const nativeCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    return file.content;
  }
};
