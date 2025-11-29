export type FrameworkType = 'react' | 'vue';

export interface FileType {
  name: string;
  content: string;
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'html' | 'vue';
}

export interface ImportMapType {
  imports: Record<string, string>;
}

export interface ProjectTemplate {
  framework: FrameworkType;
  files: FileType[];
  importMap: ImportMapType;
}
