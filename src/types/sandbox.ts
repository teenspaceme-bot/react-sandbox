export type FrameworkType = 'react' | 'vue' | 'native' | 'solid';

export interface FileType {
  name: string;
  content: string;
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'html' | 'vue' | 'css';
}

export interface ImportMapType {
  imports: Record<string, string>;
}

export interface ProjectTemplate {
  framework: FrameworkType;
  files: FileType[];
  importMap: ImportMapType;
}
