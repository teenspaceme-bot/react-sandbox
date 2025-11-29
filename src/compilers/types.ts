import type { FileType } from '../types/sandbox';

export interface Compiler {
  compile(file: FileType): Promise<string>;
}

export interface CompilerModule {
  load(): Promise<Compiler>;
}
