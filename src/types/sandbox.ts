export interface FileType {
  name: string;
  content: string;
  language?: 'javascript' | 'typescript' | 'jsx' | 'tsx';
}

export interface ImportMapType {
  imports: Record<string, string>;
}

export interface HTMLTemplateType {
  name: string;
  content: string;
}
