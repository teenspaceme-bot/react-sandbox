import type { Compiler } from './types';
import type { FileType, ImportMapType } from '../types/sandbox';

export const nativeCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    return file.content;
  },

  async compileAll(files: FileType[], importMap: ImportMapType): Promise<string> {
    const htmlFile = files.find(f => f.name.endsWith('.html'));
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    const cssFiles = files.filter(f => f.name.endsWith('.css'));

    if (!htmlFile) {
      throw new Error('No HTML file found');
    }

    let html = htmlFile.content;

    const cssContent = cssFiles.map(f => f.content).join('\n');
    if (cssContent) {
      html = html.replace('</head>', `<style>${cssContent}</style>\n</head>`);
    }

    const importMapScript = `<script type="importmap">${JSON.stringify(importMap, null, 2)}</script>`;
    html = html.replace('</head>', `${importMapScript}\n</head>`);

    jsFiles.forEach(file => {
      const scriptTag = `<script type="module">${file.content}</script>`;
      html = html.replace('</body>', `${scriptTag}\n</body>`);
    });

    return html;
  }
};
