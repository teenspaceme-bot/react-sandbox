import { transform } from '@babel/standalone';
import * as VueCompiler from '@vue/compiler-sfc';
import type { FileType } from '../types/sandbox';

export function compileReactFile(file: FileType): string {
  const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

  if (isJSXOrTSX) {
    const result = transform(file.content, {
      presets: [['react', { runtime: 'classic' }]],
      filename: file.name
    });
    return result.code || '';
  }

  return file.content;
}

export function compileVueFile(file: FileType): string {
  if (file.language !== 'vue') {
    return file.content;
  }

  try {
    const { descriptor } = VueCompiler.parse(file.content, { filename: file.name });

    let code = '';

    if (descriptor.styles.length > 0) {
      const style = descriptor.styles[0].content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `const style = document.createElement('style');\nstyle.textContent = \`${style}\`;\ndocument.head.appendChild(style);\n\n`;
    }

    const compiled = VueCompiler.compileScript(descriptor, {
      id: file.name,
      inlineTemplate: true
    });

    code += compiled.content;
    return code;
  } catch (error: any) {
    throw new Error(`Failed to compile ${file.name}: ${error.message}`);
  }
}


