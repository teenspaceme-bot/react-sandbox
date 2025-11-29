import type { FileType, ImportMapType } from '../types/sandbox';

export interface Compiler {
  compile(file: FileType): Promise<string>;
  compileAll?(files: FileType[], importMap: ImportMapType): Promise<string>;
}

export interface CompilerModule {
  load(): Promise<Compiler>;
}
